let assets = JSON.parse(localStorage.getItem('assets') || '[]');
let flows = JSON.parse(localStorage.getItem('flows') || '[]');
let expenses = parseFloat(localStorage.getItem('expenses')) || 0;

const colorPalette = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF',
    '#FF9F40', '#3F51B5', '#009688', '#795548', '#607D8B'
];
const OUTSIDE_NAME = 'Outside Cast';

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

let selectedAssetIndex = null;

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
    assets.forEach((asset, index) => {
        if(!asset.color){
            asset.color = colorPalette[index % colorPalette.length];
            updated = true;
        }
        const div = document.createElement('div');
        div.className = 'asset';
        if(index === selectedAssetIndex) div.classList.add('active');

        const info = document.createElement('div');
        info.className = 'asset-info';
        const colorBox = document.createElement('span');
        colorBox.className = 'asset-color';
        colorBox.style.background = asset.color;
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${asset.name} - ${asset.type}`;
        info.appendChild(colorBox);
        info.appendChild(nameSpan);

        const edit = document.createElement('button');
        edit.className = 'edit-btn';
        edit.innerHTML = '<i class="fa fa-pencil"></i>';
        edit.onclick = (e) => { e.stopPropagation(); openForm(index); };

        div.appendChild(info);
        div.appendChild(edit);
        div.onclick = () => {
            selectedAssetIndex = selectedAssetIndex === index ? null : index;
            updateChart();
            renderAssets();
        };

        assetList.appendChild(div);
    });
    const total = assets.reduce((s,a)=>s+a.value,0);
    totalWealthDiv.textContent = `Total wealth: ${formatNumber(total)}`;
    renderFlows();
    updatePieChart();
    if(updated) saveData();
}

function renderFlows() {
    flowList.innerHTML = '';
    flows.forEach((flow, index) => {
        const div = document.createElement('div');
        div.className = 'asset';
        const from = flow.from>=0 ? (assets[flow.from]?.name||'') : OUTSIDE_NAME;
        const to = flow.to>=0 ? (assets[flow.to]?.name||'') : OUTSIDE_NAME;
        div.textContent = `${from} -> ${to}: ${flow.amount}`;
        div.onclick = () => openFlowForm(index);
        flowList.appendChild(div);
    });
    updateSankey();
}

function renderAssetFlows(index){
    assetFlowList.innerHTML = '';
    if(index==null) return;
    flows.forEach((flow,i)=>{
        if(flow.from===index || flow.to===index){
            const div = document.createElement('div');
            div.className = 'asset';
            const from = flow.from>=0 ? (assets[flow.from]?.name||'') : OUTSIDE_NAME;
            const to = flow.to>=0 ? (assets[flow.to]?.name||'') : OUTSIDE_NAME;
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
        if(selectedAssetIndex === editIndex) selectedAssetIndex = null;
        else if(selectedAssetIndex > editIndex) selectedAssetIndex--;
        saveData();
        renderAssets();
        updateChart();
    }
    closeForm();
};

function populateFlowSelects(){
    flowFrom.innerHTML = '';
    flowTo.innerHTML = '';
    const outOpt1 = document.createElement('option');
    outOpt1.value = -1; outOpt1.textContent = OUTSIDE_NAME;
    const outOpt2 = outOpt1.cloneNode(true);
    flowFrom.appendChild(outOpt1);
    flowTo.appendChild(outOpt2);
    assets.forEach((a,i)=>{
        const opt1 = document.createElement('option');
        opt1.value = i; opt1.textContent = a.name;
        const opt2 = opt1.cloneNode(true);
        flowFrom.appendChild(opt1);
        flowTo.appendChild(opt2);
    });
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

    const bVals = assets.map(a => a.value);
    const aVals = assets.map(a => a.value);
    const wVals = assets.map(a => a.value);
    const startVals = assets.map(a => a.value);

    best[0] = assets.reduce((s,a)=>s+a.value,0);
    avg[0] = best[0];
    worst[0] = best[0];

    for (let i=1;i<=months;i++) {
        assets.forEach((asset, idx)=>{
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
            const fromOk = f.from>=0 && bVals[f.from]!=null;
            const toOk = f.to>=0 && bVals[f.to]!=null;
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

function forecastAsset(index, months){
    const best = Array(months+1).fill(0);
    const avg = Array(months+1).fill(0);
    const worst = Array(months+1).fill(0);

    const bVals = assets.map(a => a.value);
    const aVals = assets.map(a => a.value);
    const wVals = assets.map(a => a.value);
    const startVals = assets.map(a => a.value);

    best[0] = bVals[index];
    avg[0] = aVals[index];
    worst[0] = wVals[index];

    for (let i=1;i<=months;i++) {
        assets.forEach((asset, idx)=>{
            const start = startVals[idx];
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
            const fromOk = f.from>=0 && bVals[f.from]!=null;
            const toOk = f.to>=0 && bVals[f.to]!=null;
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
        best[i] = bVals[index];
        avg[i] = aVals[index];
        worst[i] = wVals[index];
    }
    return {best, avg, worst};
}

let chart = null;
let pieChart = null;

function updateChart() {
    const years = parseInt(yearsInput.value) || 20;
    const months = years * 12;
    const data = selectedAssetIndex!=null ? forecastAsset(selectedAssetIndex, months) : forecast(months);

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
    const rBest = findRetire(data.best);
    const rAvg = findRetire(data.avg);
    const rWorst = findRetire(data.worst);
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
    const labels = assets.map(a=>a.name);
    const data = assets.map(a=>a.value);
    const colors = assets.map((a,i)=>{
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
        const from = f.from>=0 ? (assets[f.from]?.name||'') : OUTSIDE_NAME;
        const to = f.to>=0 ? (assets[f.to]?.name||'') : OUTSIDE_NAME;
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
