let assets = JSON.parse(localStorage.getItem('assets') || '[]');
let flows = JSON.parse(localStorage.getItem('flows') || '[]');
let expenses = parseFloat(localStorage.getItem('expenses')) || 0;

const assetList = document.getElementById('asset-list');
const addAssetBtn = document.getElementById('add-asset');
const expensesInput = document.getElementById('expenses');
const retirementDiv = document.getElementById('retirement');
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
    const best = Array(months).fill(0);
    const avg = Array(months).fill(0);
    const worst = Array(months).fill(0);

    const bVals = assets.map(a => a.value);
    const aVals = assets.map(a => a.value);
    const wVals = assets.map(a => a.value);

    for (let i=0;i<months;i++) {
        assets.forEach((asset, idx)=>{
            // apply increase
            if(asset.incType === 'pct'){
                const bRate = asset.incBest/100/12;
                const aRate = asset.incAvg/100/12;
                const wRate = asset.incWorst/100/12;
                bVals[idx] *= 1 + bRate;
                aVals[idx] *= 1 + aRate;
                wVals[idx] *= 1 + wRate;
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
                bVals[idx] += bVals[idx]*bRate;
                aVals[idx] += aVals[idx]*aRate;
                wVals[idx] += wVals[idx]*wRate;
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
        best[i] = bVals.reduce((s,v)=>s+v,0);
        avg[i] = aVals.reduce((s,v)=>s+v,0);
        worst[i] = wVals.reduce((s,v)=>s+v,0);
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
    let retireMonth = null;
    for (let i=0;i<data.avg.length;i++) {
        if (data.avg[i] >= target) { retireMonth = i+1; break; }
    }
    if (retireMonth) {
        const years = (retireMonth/12).toFixed(1);
        retirementDiv.textContent = `${years} years to retirement`;
    } else {
        retirementDiv.textContent = 'Retirement not reached';
    }
}

renderAssets();
updateChart();
