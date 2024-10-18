const processes = [];

document.getElementById('process-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const id = document.getElementById('process-id').value;
  const arrivalTime = parseInt(document.getElementById('arrival-time').value);
  const burstTime = parseInt(document.getElementById('burst-time').value);
  processes.push({ id, arrivalTime, burstTime, originalBurstTime: burstTime });
  displayProcesses();
  this.reset();
});

function displayProcesses() {
  const processList = document.getElementById('processes');
  processList.innerHTML = '';
  processes.forEach((process, index) => {
    const li = document.createElement('li');
    li.innerHTML = `ID: ${process.id}, Arrival Time: ${process.arrivalTime}, Burst Time: ${process.burstTime} <button class="delete-btn" onclick="deleteProcess(${index})">Delete</button>`;
    processList.appendChild(li);
  });
}

function deleteProcess(index) {
  processes.splice(index, 1);
  displayProcesses();
}

function schedule(algorithm) {
  // Reset burst time for RR
  processes.forEach(process => process.burstTime = process.originalBurstTime);

  let metrics = '';
  switch (algorithm) {
    case 'FCFS':
      metrics = fcfs();
      break;
    case 'SJF':
      metrics = sjf();
      break;
    case 'RR':
      metrics = rr(2); // Quantum time for Round Robin
      break;
    default:
      metrics = 'Invalid Algorithm';
  }
  displayMetrics(metrics);
}

function displayMetrics(metrics) {
  const metricsContent = document.getElementById('metrics-content');
  metricsContent.innerHTML = '';
  metrics.forEach(metric => {
    const tr = document.createElement('tr');
    Object.values(metric).forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });
    metricsContent.appendChild(tr);
  });
  const averages = calculateAverages(metrics);
  document.getElementById('averages').textContent = `Average Waiting Time = ${averages.avgWaitingTime.toFixed(2)}, Average Turnaround Time = ${averages.avgTurnaroundTime.toFixed(2)}`;
}

function calculateAverages(metrics) {
  const totalWaitingTime = metrics.reduce((sum, metric) => sum + metric.waitingTime, 0);
  const totalTurnaroundTime = metrics.reduce((sum, metric) => sum + metric.turnaroundTime, 0);
  const avgWaitingTime = totalWaitingTime / metrics.length;
  const avgTurnaroundTime = totalTurnaroundTime / metrics.length;
  return { avgWaitingTime, avgTurnaroundTime };
}

function fcfs() {
  processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  let currentTime = 0;
  const metrics = processes.map(process => {
    const completionTime = Math.max(currentTime, process.arrivalTime) + process.burstTime;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;
    currentTime = completionTime;
    return {
      id: process.id,
      burstTime: process.burstTime,
      arrivalTime: process.arrivalTime,
      completionTime,
      turnaroundTime,
      waitingTime
    };
  });
  return metrics;
}

function sjf() {
  const remainingProcesses = processes.slice();
  remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime);
  let currentTime = 0;
  const metrics = [];
  while (remainingProcesses.length > 0) {
    const process = remainingProcesses.filter(p => p.arrivalTime <= currentTime)
                                      .sort((a, b) => a.burstTime - b.burstTime)[0] || remainingProcesses[0];
    remainingProcesses.splice(remainingProcesses.indexOf(process), 1);
    const startTime = Math.max(currentTime, process.arrivalTime);
    const completionTime = startTime + process.burstTime;
    const turnaroundTime = completionTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;
    currentTime = completionTime;
    metrics.push({
      id: process.id,
      burstTime: process.burstTime,
      arrivalTime: process.arrivalTime,
      completionTime,
      turnaroundTime,
      waitingTime
    });
  }
  return metrics;
}

function rr(quantum) {
  const queue = processes.map(process => ({ ...process }));
  queue.sort((a, b) => a.arrivalTime - b.arrivalTime);
  let currentTime = 0;
  const metrics = [];
  const pendingProcesses = [];

  while (queue.length > 0 || pendingProcesses.length > 0) {
    while (queue.length > 0 && queue[0].arrivalTime <= currentTime) {
      pendingProcesses.push(queue.shift());
    }

    if (pendingProcesses.length > 0) {
      const process = pendingProcesses.shift();
      const executionTime = Math.min(quantum, process.burstTime);
      process.burstTime -= executionTime;
      currentTime += executionTime;

      if (process.burstTime > 0) {
        pendingProcesses.push(process);
      } else {
        const completionTime = currentTime;
        const turnaroundTime = completionTime - process.arrivalTime;
        const waitingTime = turnaroundTime - process.originalBurstTime;
        metrics.push({
          id: process.id,
          burstTime: process.originalBurstTime,
          arrivalTime: process.arrivalTime,
          completionTime,
          turnaroundTime,
          waitingTime
        });
      }
    } else {
      currentTime = queue.length > 0 ? queue[0].arrivalTime : currentTime;
    }
  }
  return metrics;
}
