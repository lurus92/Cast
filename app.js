let assets = JSON.parse(localStorage.getItem('assets') || '[]');
let flows = JSON.parse(localStorage.getItem('flows') || '[]');
let expenses = parseFloat(localStorage.getItem('expenses')) || 0;

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
const divBest = document.getElementById('div-best');
const divAvg = document.getElementById('div-avg');
const divWorst = document.getElementById('div-worst');
const incType = document.getElementById('inc-type');
const divType = document.getElementById('div-type');
const compoundInput = document.getElementById('asset-compound');
const weightInput = document.getElementById('asset-weight');
const compToggle = document.getElementById('asset-comp-toggle');
const saveAsset = document.getElementById('save-asset');
const cancelAsset = document.getElementById('cancel-asset');
const deleteAssetBtn = document.getElementById('delete-asset');

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
    assets.forEach((asset, index) => {
        const div = document.createElement('div');
        div.className = 'asset';
        div.textContent = `${asset.name} - ${asset.type}`;
        div.onclick = () => openForm(index);
        assetList.appendChild(div);
    });
    const total = assets.reduce((s,a)=>s+a.value*(a.weight??100)/100,0);
    totalWealthDiv.textContent = `Total wealth: ${total.toFixed(2)}`;
    renderFlows();
}

function renderFlows() {
    flowList.innerHTML = '';
    flows.forEach((flow, index) => {
        const div = document.createElement('div');
        div.className = 'asset';
        const from = assets[flow.from]?.name || '';
        const to = assets[flow.to]?.name || '';
        div.textContent = `${from} -> ${to}: ${flow.amount}`;
        div.onclick = () => openFlowForm(index);
        flowList.appendChild(div);
    });
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
        divBest.value = a.divBest;
        divAvg.value = a.divAvg;
        divWorst.value = a.divWorst;
        incType.value = a.incType || 'abs';
        divType.value = a.divType || 'abs';
        compoundInput.value = a.compound;
        weightInput.value = a.weight ?? 100;
        compToggle.checked = a.compoundEnabled !== false;
        deleteAssetBtn.classList.remove('hidden');
    } else {
        editIndex = null;
        formTitle.textContent = 'New Asset';
        nameInput.value = '';
        typeInput.value = 'cash';
        valueInput.value = '';
        incBest.value = '';
        incAvg.value = '';
        incWorst.value = '';
        divBest.value = '';
        divAvg.value = '';
        divWorst.value = '';
        incType.value = 'abs';
        divType.value = 'abs';
        compoundInput.value = 'monthly';
        weightInput.value = 100;
        compToggle.checked = true;
        deleteAssetBtn.classList.add('hidden');
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
        divBest: parseFloat(divBest.value) || 0,
        divAvg: parseFloat(divAvg.value) || 0,
        divWorst: parseFloat(divWorst.value) || 0,
        incType: incType.value,
        divType: divType.value,
        compound: compoundInput.value,
        weight: parseFloat(weightInput.value) || 100,
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
        assets[editIndex] = data;
    } else {
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

    best[0] = assets.reduce((s,a)=>s+a.value*(a.weight??100)/100,0);
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
            // apply dividends
            if(asset.divType === 'pct'){
                const bRate = asset.divBest/100/12;
                const aRate = asset.divAvg/100/12;
                const wRate = asset.divWorst/100/12;
                if(asset.compoundEnabled!==false){
                    bVals[idx] += bVals[idx]*bRate;
                    aVals[idx] += aVals[idx]*aRate;
                    wVals[idx] += wVals[idx]*wRate;
                } else {
                    bVals[idx] += start*bRate;
                    aVals[idx] += start*aRate;
                    wVals[idx] += start*wRate;
                }
            } else {
                bVals[idx] += asset.divBest;
                aVals[idx] += asset.divAvg;
                wVals[idx] += asset.divWorst;
            }
        });
        flows.forEach(f=>{
            if(bVals[f.from]!=null && bVals[f.to]!=null){
                bVals[f.from]-=f.amount; bVals[f.to]+=f.amount;
                aVals[f.from]-=f.amount; aVals[f.to]+=f.amount;
                wVals[f.from]-=f.amount; wVals[f.to]+=f.amount;
            }
        });
        best[i] = bVals.reduce((s,v,idx)=>s+v*(assets[idx].weight??100)/100,0);
        avg[i] = aVals.reduce((s,v,idx)=>s+v*(assets[idx].weight??100)/100,0);
        worst[i] = wVals.reduce((s,v,idx)=>s+v*(assets[idx].weight??100)/100,0);
    }
    return {best, avg, worst};
}

let chart = null;

function updateChart() {
    const years = parseInt(yearsInput.value) || 20;
    const months = years * 12;
    const data = forecast(months);

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
                    ticks: {stepSize: 1}
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
        row.innerHTML = `<td>${y}</td><td>${b.toFixed(2)}</td><td>${a.toFixed(2)}</td><td>${w.toFixed(2)}</td>`;
        yearTable.appendChild(row);
    }
}

renderAssets();
updateChart();
