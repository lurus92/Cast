let assets = JSON.parse(localStorage.getItem('assets') || '[]');
// Ensure visibility flag exists
assets.forEach(a => { if(a.visible === undefined) a.visible = true; });
let flows = JSON.parse(localStorage.getItem('flows') || '[]');
let expenses = parseFloat(localStorage.getItem('expenses')) || 0;

const colorPalette = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF',
    '#FF9F40', '#3F51B5', '#009688', '#795548', '#607D8B'
];
const OUTSIDE_INCOME = 'Outside Cast (income)';
const OUTSIDE_EXPENSE = 'Outside Cast (expense)';

const ASSET_TYPE_ICONS = {
    cash: 'fa-money-bill',
    investing: 'fa-chart-line',
    realestate: 'fa-house'
};

function formatNumber(v){
    const abs = Math.abs(v);
    if(abs >= 1e6) return (v/1e6).toFixed(1) + 'M';
    if(abs >= 1e3) return (v/1e3).toFixed(1) + 'K';
    return v.toFixed(0);
}

const assetList = document.getElementById('asset-list');
const addAssetBtn = document.getElementById('add-asset');
const totalWealthDiv = document.getElementById('total-wealth');
const expensesInput = document.getElementById('expenses');
const retireBestSpan = document.getElementById('retire-best');
const retireAvgSpan = document.getElementById('retire-avg');
const retireWorstSpan = document.getElementById('retire-worst');
const yearTable = document.getElementById('year-table');
const yearsInput = document.getElementById('years');


const formModal = document.getElementById('asset-form');
const formTitle = document.getElementById('form-title');
const nameInput = document.getElementById('asset-name');
const typeInput = document.getElementById('asset-type');
const valueInput = document.getElementById('asset-value');
const incBest = document.getElementById('inc-best');
const incAvg = document.getElementById('inc-avg');
const incWorst = document.getElementById('inc-worst');
const incType = document.getElementById('inc-type');
const compoundInput = document.getElementById('asset-compound');
const compToggle = document.getElementById('asset-comp-toggle');
const assetAddFlowBtn = document.getElementById('asset-add-flow');
const assetFlowList = document.getElementById('asset-flow-list');
const compFreqLabel = document.getElementById('compound-frequency');
const saveAsset = document.getElementById('save-asset');
const cancelAsset = document.getElementById('cancel-asset');
const deleteAssetBtn = document.getElementById('delete-asset');

compToggle.onchange = updateCompoundVisibility;
updateCompoundVisibility();

// Handle asset type icon updates
typeInput.onchange = () => {
    const wrapper = typeInput.parentElement;
    const icon = wrapper.querySelector('i');
    icon.className = `fa ${ASSET_TYPE_ICONS[typeInput.value] || 'fa-question'} asset-type-icon`;
};

const flowList = document.getElementById('flow-list');
const addFlowBtn = document.getElementById('add-flow');
const flowModal = document.getElementById('flow-form');
const flowTitle = document.getElementById('flow-title');
const flowFrom = document.getElementById('flow-from');
const flowTo = document.getElementById('flow-to');
const flowAmount = document.getElementById('flow-amount');
const saveFlow = document.getElementById('save-flow');
const cancelFlow = document.getElementById('cancel-flow');
const deleteFlowBtn = document.getElementById('delete-flow');
const sankeyDiv = document.getElementById('flow-sankey');
let sankeyChart = null;
let sankeyReady = false;
google.charts.load('current', {packages:['sankey']});
google.charts.setOnLoadCallback(() => {
    sankeyReady = true;
    updateSankey();
});

let editIndex = null;
let editFlowIndex = null;

expensesInput.value = expenses;

function saveData() {
    localStorage.setItem('assets', JSON.stringify(assets));
    localStorage.setItem('flows', JSON.stringify(flows));
    localStorage.setItem('expenses', expensesInput.value || '0');
}

function renderAssets() {
    assetList.innerHTML = '';
    let updated = false;
    const visibleAssets = assets.filter(a => a.visible !== false);
    const total = visibleAssets.reduce((s,a)=>s+a.value,0);

    assets.forEach((asset, index) => {
        if(!asset.color){
            asset.color = colorPalette[index % colorPalette.length];
            updated = true;
        }
        const div = document.createElement('div');
        div.className = 'asset';

        const info = document.createElement('div');
        info.className = 'asset-info';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'asset-checkbox';
        checkbox.checked = asset.visible !== false;
        checkbox.style.accentColor = asset.color;
        checkbox.onchange = (e) => {
            e.stopPropagation();
            asset.visible = checkbox.checked;
            saveData();
            renderAssets();
            updateChart();
        };

        const typeIcon = document.createElement('i');
        typeIcon.className = `fa ${ASSET_TYPE_ICONS[asset.type] || 'fa-question'} asset-type-icon`;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = asset.name;

        const percentageSpan = document.createElement('span');
        percentageSpan.className = 'asset-percentage';
        const pct = asset.visible !== false && total > 0 ? ((asset.value / total) * 100).toFixed(1) : '0.0';
        percentageSpan.textContent = ` (${pct}%)`;

        info.appendChild(checkbox);
        info.appendChild(typeIcon);
        info.appendChild(nameSpan);
        info.appendChild(percentageSpan);

        const edit = document.createElement('button');
        edit.className = 'edit-btn';
        edit.innerHTML = '<i class="fa fa-pencil"></i>';
        edit.onclick = (e) => { e.stopPropagation(); openForm(index); };

        div.appendChild(info);
        div.appendChild(edit);

        assetList.appendChild(div);
    });
    
    totalWealthDiv.textContent = `Total wealth: ${formatNumber(total)}`;
    renderFlows();
    updatePieChart();
    if(updated) saveData();
}

function renderFlows() {
    // Get flow sections
    const incomeSection = document.querySelector('#income-flows .flow-list');
    const internalSection = document.querySelector('#internal-flows .flow-list');
    const outgoingSection = document.querySelector('#outgoing-flows .flow-list');
    const incomeTotal = document.querySelector('#income-flows .flow-total');
    const outgoingTotal = document.querySelector('#outgoing-flows .flow-total');
    
    // Clear all sections
    incomeSection.innerHTML = '';
    internalSection.innerHTML = '';
    outgoingSection.innerHTML = '';
    
    let totalIncome = 0;
    let totalOutgoing = 0;

    flows.forEach((flow, index) => {
        if((flow.from >= 0 && assets[flow.from]?.visible === false) ||
           (flow.to >= 0 && assets[flow.to]?.visible === false)){
            return; // hide flows involving hidden assets
        }
        const div = document.createElement('div');
        div.className = 'flow';
        
        const from = flow.from >= 0 ? (assets[flow.from]?.name||'') : 
                    (flow.to >= 0 ? OUTSIDE_INCOME : OUTSIDE_EXPENSE);
        const to = flow.to >= 0 ? (assets[flow.to]?.name||'') : 
                  (flow.from >= 0 ? OUTSIDE_EXPENSE : OUTSIDE_INCOME);
        
        // Create flow elements
        const fromText = document.createElement('span');
        fromText.textContent = from;
        
        const arrow = document.createElement('i');
        arrow.className = 'fa fa-arrow-right flow-arrow';
        
        const toText = document.createElement('span');
        toText.textContent = to;
        
        const amount = document.createElement('span');
        amount.textContent = formatNumber(flow.amount);
        
        // Determine flow type and add to appropriate section
        if (flow.from === -1 && flow.to >= 0) {
            // Income flow
            amount.className = 'flow-amount income';
            totalIncome += flow.amount;
            div.append(fromText, arrow, toText, amount);
            incomeSection.appendChild(div);
        } else if (flow.from >= 0 && flow.to === -1) {
            // Outgoing flow
            amount.className = 'flow-amount outgoing';
            totalOutgoing += flow.amount;
            div.append(fromText, arrow, toText, amount);
            outgoingSection.appendChild(div);
        } else if (flow.from >= 0 && flow.to >= 0) {
            // Internal flow
            amount.className = 'flow-amount internal';
            div.append(fromText, arrow, toText, amount);
            internalSection.appendChild(div);
        }
        
        div.onclick = () => openFlowForm(index);
    });
    
    // Update totals
    incomeTotal.textContent = `Total Income: ${formatNumber(totalIncome)}`;
    outgoingTotal.textContent = `Total Outgoing: ${formatNumber(totalOutgoing)}`;
    
    updateSankey();
}

function renderAssetFlows(index){
    assetFlowList.innerHTML = '';
    if(index==null) return;
    flows.forEach((flow,i)=>{
        if(flow.from===index || flow.to===index){
            const div = document.createElement('div');
            div.className = 'asset';
            const from = flow.from>=0 ? (assets[flow.from]?.name||'') : 
                        (flow.to >= 0 ? OUTSIDE_INCOME : OUTSIDE_EXPENSE);
            const to = flow.to>=0 ? (assets[flow.to]?.name||'') : 
                      (flow.from >= 0 ? OUTSIDE_EXPENSE : OUTSIDE_INCOME);
            div.textContent = `${from} -> ${to}: ${flow.amount}`;
            div.onclick = () => openFlowForm(i);
            assetFlowList.appendChild(div);
        }
    });
}

function updateCompoundVisibility(){
    compFreqLabel.style.display = compToggle.checked ? 'flex' : 'none';
}

function openForm(index) {
    if (index != null) {
        editIndex = index;
        const a = assets[index];
        formTitle.textContent = 'Edit Asset';
        nameInput.value = a.name;
        typeInput.value = a.type;
        valueInput.value = a.value;
        incBest.value = a.incBest;
        incAvg.value = a.incAvg;
        incWorst.value = a.incWorst;
        incType.value = a.incType || 'abs';
        compoundInput.value = a.compound;
        compToggle.checked = a.compoundEnabled !== false;
        updateCompoundVisibility();
        deleteAssetBtn.classList.remove('hidden');
        assetAddFlowBtn.classList.remove('hidden');
        renderAssetFlows(index);
    } else {
        editIndex = null;
        formTitle.textContent = 'New Asset';
        nameInput.value = '';
        typeInput.value = 'cash';
        valueInput.value = '';
        incBest.value = '';
        incAvg.value = '';
        incWorst.value = '';
        incType.value = 'abs';
        compoundInput.value = 'monthly';
        compToggle.checked = true;
        updateCompoundVisibility();
        deleteAssetBtn.classList.add('hidden');
        assetAddFlowBtn.classList.remove('hidden');
        renderAssetFlows(null);
    }
    formModal.classList.remove('hidden');
}

function closeForm() { formModal.classList.add('hidden'); }
function closeFlowForm(){ flowModal.classList.add('hidden'); }

function formData() {
    return {
        name: nameInput.value,
        type: typeInput.value,
        value: parseFloat(valueInput.value) || 0,
        incBest: parseFloat(incBest.value) || 0,
        incAvg: parseFloat(incAvg.value) || 0,
        incWorst: parseFloat(incWorst.value) || 0,
        incType: incType.value,
        compound: compoundInput.value,
        compoundEnabled: compToggle.checked,
    };
}

function flowData() {
    return {
        from: parseInt(flowFrom.value),
        to: parseInt(flowTo.value),
        amount: parseFloat(flowAmount.value) || 0,
    };
}

saveAsset.onclick = () => {
    const data = formData();
    if (editIndex != null) {
        data.color = assets[editIndex].color;
        assets[editIndex] = data;
    } else {
        data.color = colorPalette[assets.length % colorPalette.length];
        assets.push(data);
    }
    saveData();
    renderAssets();
    updateChart();
    closeForm();
};

cancelAsset.onclick = closeForm;
addAssetBtn.onclick = () => openForm(null);
expensesInput.onchange = () => {
    expenses = parseFloat(expensesInput.value) || 0;
    saveData();
    updateChart();
};
yearsInput.onchange = updateChart;

// Handle years control buttons
const yearsPlusBtn = document.getElementById('years-plus');
const yearsMinusBtn = document.getElementById('years-minus');

yearsPlusBtn.onclick = () => {
    const currentValue = parseInt(yearsInput.value) || 20;
    yearsInput.value = currentValue + 1;
    yearsInput.dispatchEvent(new Event('change'));
};

yearsMinusBtn.onclick = () => {
    const currentValue = parseInt(yearsInput.value) || 20;
    if (currentValue > 1) {  // Ensure we don't go below min value
        yearsInput.value = currentValue - 1;
        yearsInput.dispatchEvent(new Event('change'));
    }
};

assetAddFlowBtn.onclick = () => {
    if(editIndex != null){
        openFlowForm(null);
        flowFrom.value = editIndex;
    }
};

deleteAssetBtn.onclick = () => {
    if(editIndex != null){
        assets.splice(editIndex,1);
        saveData();
        renderAssets();
        updateChart();
    }
    closeForm();
};

function populateFlowSelects(){
    flowFrom.innerHTML = '';
    flowTo.innerHTML = '';
    
    // Add "Outside Cast (income)" only to "From" select
    const outIncomeOpt = document.createElement('option');
    outIncomeOpt.value = -1;
    outIncomeOpt.textContent = OUTSIDE_INCOME;
    flowFrom.appendChild(outIncomeOpt);
    
    // Add assets
    assets.forEach((a,i)=>{
        const opt1 = document.createElement('option');
        opt1.value = i;
        opt1.textContent = a.name;
        const opt2 = opt1.cloneNode(true);
        flowFrom.appendChild(opt1);
        flowTo.appendChild(opt2);
    });
    
    // Add "Outside Cast (expense)" only to "To" select
    const outExpenseOpt = document.createElement('option');
    outExpenseOpt.value = -1;
    outExpenseOpt.textContent = OUTSIDE_EXPENSE;
    flowTo.appendChild(outExpenseOpt);
}

function openFlowForm(index){
    populateFlowSelects();
    if(index != null){
        editFlowIndex = index;
        const f = flows[index];
        flowTitle.textContent = 'Edit Flow';
        flowFrom.value = f.from;
        flowTo.value = f.to;
        flowAmount.value = f.amount;
        deleteFlowBtn.classList.remove('hidden');
    } else {
        editFlowIndex = null;
        flowTitle.textContent = 'New Flow';
        flowFrom.selectedIndex = 0;
        flowTo.selectedIndex = 0;
        flowAmount.value = '';
        deleteFlowBtn.classList.add('hidden');
    }
    flowModal.classList.remove('hidden');
}

saveFlow.onclick = () => {
    const data = flowData();
    if(editFlowIndex != null){
        flows[editFlowIndex] = data;
    } else {
        flows.push(data);
    }
    saveData();
    renderFlows();
    updateChart();
    updateSankey();
    closeFlowForm();
};

cancelFlow.onclick = closeFlowForm;
addFlowBtn.onclick = () => openFlowForm(null);

deleteFlowBtn.onclick = () => {
    if(editFlowIndex != null){
        flows.splice(editFlowIndex,1);
        saveData();
        renderFlows();
        updateChart();
        updateSankey();
    }
    closeFlowForm();
};

function forecast(months) {
    const best = Array(months+1).fill(0);
    const avg = Array(months+1).fill(0);
    const worst = Array(months+1).fill(0);

    const bVals = assets.map(a => a.visible !== false ? a.value : 0);
    const aVals = assets.map(a => a.visible !== false ? a.value : 0);
    const wVals = assets.map(a => a.visible !== false ? a.value : 0);
    const startVals = assets.map(a => a.visible !== false ? a.value : 0);

    best[0] = bVals.reduce((s,v)=>s+v,0);
    avg[0] = best[0];
    worst[0] = best[0];

    for (let i=1;i<=months;i++) {
        assets.forEach((asset, idx)=>{
            if(asset.visible === false) return;
            const start = startVals[idx];
            // apply increase
            if(asset.incType === 'pct'){
                const bRate = asset.incBest/100/12;
                const aRate = asset.incAvg/100/12;
                const wRate = asset.incWorst/100/12;
                if(asset.compoundEnabled!==false){
                    bVals[idx] *= 1 + bRate;
                    aVals[idx] *= 1 + aRate;
                    wVals[idx] *= 1 + wRate;
                } else {
                    bVals[idx] += start*bRate;
                    aVals[idx] += start*aRate;
                    wVals[idx] += start*wRate;
                }
            } else {
                bVals[idx] += asset.incBest;
                aVals[idx] += asset.incAvg;
                wVals[idx] += asset.incWorst;
            }
        });
        flows.forEach(f=>{
            const fromOk = f.from>=0 && assets[f.from]?.visible!==false;
            const toOk = f.to>=0 && assets[f.to]?.visible!==false;
            if(fromOk && toOk){
                bVals[f.from]-=f.amount; bVals[f.to]+=f.amount;
                aVals[f.from]-=f.amount; aVals[f.to]+=f.amount;
                wVals[f.from]-=f.amount; wVals[f.to]+=f.amount;
            } else if(fromOk && f.to===-1){
                bVals[f.from]-=f.amount;
                aVals[f.from]-=f.amount;
                wVals[f.from]-=f.amount;
            } else if(toOk && f.from===-1){
                bVals[f.to]+=f.amount;
                aVals[f.to]+=f.amount;
                wVals[f.to]+=f.amount;
            }
        });
        best[i] = bVals.reduce((s,v)=>s+v,0);
        avg[i] = aVals.reduce((s,v)=>s+v,0);
        worst[i] = wVals.reduce((s,v)=>s+v,0);
    }
    return {best, avg, worst};
}


let chart = null;
let pieChart = null;

const MAX_RETIRE_YEARS = 100;

function updateChart() {
    const years = parseInt(yearsInput.value) || 20;
    const months = years * 12;
    const data = forecast(months);
    const retireMonths = MAX_RETIRE_YEARS * 12;
    const retireData = forecast(retireMonths);

    const bestPts = data.best.map((v,i)=>({x:i/12, y:v}));
    const avgPts = data.avg.map((v,i)=>({x:i/12, y:v}));
    const worstPts = data.worst.map((v,i)=>({x:i/12, y:v}));

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'), {
        type: 'line',
        data: {
            datasets: [
                {label: 'Best', data: bestPts, borderColor: 'green', fill:false},
                {label: 'Average', data: avgPts, borderColor: 'blue', fill:false},
                {label: 'Worst', data: worstPts, borderColor: 'red', fill:false}
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    title: {display: true, text: 'Years'},
                    ticks: { stepSize: 1 }
                },
                y: {
                    ticks: {
                        callback: value => formatNumber(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: ctx => ctx.dataset.label + ': ' + formatNumber(ctx.parsed.y)
                    }
                }
            }
        }
    });

    const target = (parseFloat(expensesInput.value) || 0) * 25;
    const findRetire = arr => {
        for(let i=0;i<arr.length;i++) if(arr[i]>=target) return i; return null;
    };
    const rBest = findRetire(retireData.best);
    const rAvg = findRetire(retireData.avg);
    const rWorst = findRetire(retireData.worst);
    retireBestSpan.textContent = rBest!=null?`Best: ${(rBest/12).toFixed(1)} yrs`:'Best: N/A';
    retireAvgSpan.textContent = rAvg!=null?`Average: ${(rAvg/12).toFixed(1)} yrs`:'Average: N/A';
    retireWorstSpan.textContent = rWorst!=null?`Worst: ${(rWorst/12).toFixed(1)} yrs`:'Worst: N/A';

    yearTable.innerHTML = '';
    const header = document.createElement('tr');
    header.innerHTML = '<th>Year</th><th>Best</th><th>Average</th><th>Worst</th>';
    yearTable.appendChild(header);
    for(let y=0;y<=10&&y<data.best.length;y++){
        const row = document.createElement('tr');
        const b = data.best[Math.min(y*12,data.best.length-1)];
        const a = data.avg[Math.min(y*12,data.avg.length-1)];
        const w = data.worst[Math.min(y*12,data.worst.length-1)];
        row.innerHTML = `<td>${y}</td><td>${formatNumber(b)}</td><td>${formatNumber(a)}</td><td>${formatNumber(w)}</td>`;
        yearTable.appendChild(row);
    }
}

function updatePieChart(){
    const visible = assets.filter(a => a.visible !== false);
    const labels = visible.map(a=>a.name);
    const data = visible.map(a=>a.value);
    const colors = visible.map((a,i)=>{
        if(!a.color) a.color = colorPalette[i % colorPalette.length];
        return a.color;
    });
    const ctx = document.getElementById('asset-pie');
    if(!ctx) return;
    if(pieChart) pieChart.destroy();
    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {labels, datasets:[{data, backgroundColor: colors}]},
        options: {plugins: {legend: {display: false}}}
    });
}

function updateSankey(){
    if(!sankeyReady || !sankeyDiv) return;
    const data = new google.visualization.DataTable();
    data.addColumn('string','From');
    data.addColumn('string','To');
    data.addColumn('number','Amount');
    flows.forEach(f=>{
        if((f.from>=0 && assets[f.from]?.visible===false) ||
           (f.to>=0 && assets[f.to]?.visible===false)) return;
        const from = f.from>=0 ? (assets[f.from]?.name||'') :
                   OUTSIDE_INCOME;
        const to = f.to>=0 ? (assets[f.to]?.name||'') :
                 OUTSIDE_EXPENSE;
        if(from && to) data.addRow([from,to,f.amount]);
    });
    if(!sankeyChart) sankeyChart = new google.visualization.Sankey(sankeyDiv);
    const width = sankeyDiv.clientWidth;
    sankeyChart.draw(data, {width, height:300});
}

renderAssets();
updateChart();
updatePieChart();

// Tab navigation for mobile
const sections = document.querySelectorAll('.tab-section');
const tabButtons = document.querySelectorAll('.tab-bar button');

function showTab(id){
    sections.forEach(sec=>{
        if(sec.id === id) sec.classList.add('active');
        else sec.classList.remove('active');
    });
}

tabButtons.forEach(btn=>{
    btn.addEventListener('click',()=>{
        tabButtons.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        showTab(btn.dataset.tab);
    });
});

// Show default tab
showTab('forecast-section');
window.addEventListener('resize', updateSankey);
