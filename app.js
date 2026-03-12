// ═══════════════════════════════════════════════════
// CPU Scheduling Simulator — Application Logic
// Faithful recreation of the reference site
// ═══════════════════════════════════════════════════

(() => {
  'use strict';

  // ── DOM refs ──────────────────────────────────────
  const $ = id => document.getElementById(id);
  const algoSelect     = $('algo-select');
  const algoDesc       = $('algo-description');
  const algoDescText   = $('algo-desc-text');
  const revealHint     = $('reveal-hint');
  const quantumRow     = $('quantum-row');
  const quantumInput   = $('quantum-input');
  const btnSubmit      = $('btn-submit');
  const btnShare       = $('btn-share');
  const btnRandom      = $('btn-random');
  const btnAddProcess  = $('btn-add-process');
  const btnClear       = $('btn-clear');
  const processList    = $('process-list');
  const resultsSection = $('results-section');
  const ganttChart     = $('gantt-chart');
  const ganttTimeAxis  = $('gantt-time-axis');
  const resultsTbody   = $('results-tbody');
  const resultsTfoot   = $('results-tfoot');
  const summaryStats   = $('summary-stats');
  const modalOverlay   = $('modal-overlay');
  const modalTitle     = $('modal-title');
  const inputArrival   = $('input-arrival');
  const inputBurst     = $('input-burst');
  const inputColor     = $('input-color');
  const colorPreview   = $('color-preview');
  const btnModalSubmit = $('btn-modal-submit');

  // ── State ─────────────────────────────────────────
  let processes = [];
  let editIndex = null;

  const DESCRIPTIONS = {
    FCFS: 'Processes are executed in the order they arrive. Simple but may cause long waiting times.',
    SJF: 'Executes the shortest job first. Minimizes average waiting time but may cause starvation.',
    RR: 'Each process gets a fixed time quantum in circular order. Fair and responsive for time-sharing systems.',
    SRTF: 'Preemptive version of SJF. Always executes the process with the shortest remaining time.'
  };

  // ── Random color generator (HSL with high saturation) ──
  function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    const sat = 60 + Math.floor(Math.random() * 40);
    const lit = 50 + Math.floor(Math.random() * 20);
    return `hsl(${hue}, ${sat}%, ${lit}%)`;
  }

  // ── Glitch title animation ────────────────────────
  (function initTitle() {
    const text = 'SCHEDULING ALGORITHM SIMULATOR';
    const titleEl = $('main-title');
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      if (ch === ' ') {
        span.className = 'space-char';
        span.innerHTML = '&nbsp;';
      } else {
        span.className = 'letter';
        span.style.setProperty('--i', i);
        span.textContent = ch;
      }
      titleEl.appendChild(span);
    });
  })();

  // ── Starfield canvas ──────────────────────────────
  (function initStarfield() {
    const canvas = $('starfield');
    const ctx = canvas.getContext('2d');
    let stars = [];
    const NUM_STARS = 120;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function createStars() {
      stars = [];
      for (let i = 0; i < NUM_STARS; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.5 + 0.3,
          alpha: Math.random() * 0.8 + 0.2,
          speed: Math.random() * 0.3 + 0.05
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
        ctx.fill();

        // Twinkle
        s.alpha += s.speed * 0.02 * (Math.random() > 0.5 ? 1 : -1);
        s.alpha = Math.max(0.1, Math.min(0.9, s.alpha));
      });
      requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();
    window.addEventListener('resize', () => { resize(); createStars(); });
  })();

  // ── Render process list ───────────────────────────
  function renderProcessList() {
    processList.innerHTML = '';
    processes.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'process-item';
      div.innerHTML = `
        <div class="process-color-badge" style="background:${p.background}" title="Click to edit">
          <span class="edit-icon">✏️</span>
        </div>
        <div class="process-info">
          <div class="process-name">Process ${i + 1}</div>
          <div class="process-detail">Arrival Time : ${p.arrival_time}</div>
          <div class="process-detail">Burst Time : ${p.burst_time}</div>
        </div>
      `;
      div.querySelector('.process-color-badge').addEventListener('click', () => openEditModal(i));
      processList.appendChild(div);
    });
  }

  // ── Modal ─────────────────────────────────────────
  function openAddModal() {
    editIndex = null;
    modalTitle.textContent = 'Add Process';
    inputArrival.value = 0;
    inputBurst.value = 1;
    const col = randomColor();
    inputColor.value = hslToHex(col);
    colorPreview.style.background = col;
    modalOverlay.classList.add('active');
  }

  function openEditModal(index) {
    editIndex = index;
    const p = processes[index];
    modalTitle.textContent = `Edit Process ${index + 1}`;
    inputArrival.value = p.arrival_time;
    inputBurst.value = p.burst_time;
    inputColor.value = hslToHex(p.background);
    colorPreview.style.background = p.background;
    modalOverlay.classList.add('active');
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    editIndex = null;
  }

  // ── HSL to Hex helper ─────────────────────────────
  function hslToHex(hslStr) {
    const temp = document.createElement('div');
    temp.style.color = hslStr;
    document.body.appendChild(temp);
    const rgb = window.getComputedStyle(temp).color;
    document.body.removeChild(temp);
    const match = rgb.match(/(\d+)/g);
    if (!match) return '#ef4444';
    return '#' + match.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
  }

  function hexToHsl(hex) {
    // Return the hex as-is since browsers can use both
    return hex;
  }

  // ── Submit modal ──────────────────────────────────
  btnModalSubmit.addEventListener('click', () => {
    const arrival = Math.max(0, parseInt(inputArrival.value) || 0);
    const burst = Math.max(1, parseInt(inputBurst.value) || 1);
    const bg = inputColor.value;

    if (editIndex !== null) {
      processes[editIndex].arrival_time = arrival;
      processes[editIndex].burst_time = burst;
      processes[editIndex].background = bg;
    } else {
      processes.push({
        process_id: processes.length + 1,
        arrival_time: arrival,
        burst_time: burst,
        background: bg
      });
    }

    renderProcessList();
    closeModal();

    // Reset for next add
    inputArrival.value = 0;
    inputBurst.value = 1;
    const newCol = randomColor();
    inputColor.value = hslToHex(newCol);
    colorPreview.style.background = newCol;
  });

  inputColor.addEventListener('input', () => {
    colorPreview.style.background = inputColor.value;
  });

  // Close modal on overlay click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ── Algorithm description ─────────────────────────
  algoSelect.addEventListener('change', () => {
    const algo = algoSelect.value;
    quantumRow.classList.toggle('visible', algo === 'RR');

    if (DESCRIPTIONS[algo]) {
      algoDescText.textContent = DESCRIPTIONS[algo];
      algoDesc.style.display = '';
      algoDesc.classList.add('blurred');
      revealHint.style.display = '';
    }
  });

  algoDesc.addEventListener('click', () => {
    const isBlurred = algoDesc.classList.contains('blurred');
    algoDesc.classList.toggle('blurred');
    revealHint.style.display = isBlurred ? 'none' : '';
  });

  // ── Gantt Chart Rendering ─────────────────────────
  function renderGantt(sequence) {
    ganttChart.innerHTML = '';
    ganttTimeAxis.innerHTML = '';

    const totalTime = sequence.reduce((acc, p) => acc + p.burst_time, 0);
    let time = 0;

    sequence.forEach((p, i) => {
      const widthPct = (p.burst_time / totalTime) * 100;

      // Gantt block
      const block = document.createElement('div');
      block.className = 'gantt-block';
      block.style.width = widthPct + '%';
      block.style.animationDelay = (i * 0.15) + 's';

      if (p.arrival_time === -1) {
        // Idle
        block.style.background = 'transparent';
        block.textContent = 'Idle';
      } else {
        const isGradient = p.background && p.background.includes('gradient');
        if (isGradient) {
          block.style.backgroundImage = p.background;
        } else {
          block.style.backgroundColor = p.background;
        }
        block.textContent = 'P' + p.process_id;
      }

      ganttChart.appendChild(block);

      // Time tick
      const tick = document.createElement('div');
      tick.className = 'gantt-time-tick';
      tick.style.width = widthPct + '%';

      const displayTime = time;
      time += p.burst_time;

      if (i === sequence.length - 1) {
        // Last block: show start and end
        tick.innerHTML = `<span class="tick-start">${displayTime}</span><span class="tick-end">${time}</span>`;
        tick.style.display = 'flex';
        tick.style.justifyContent = 'space-between';
      } else if (i === 0) {
        tick.textContent = displayTime;
      } else {
        tick.innerHTML = `<span class="tick-start">${displayTime}</span>`;
      }

      ganttTimeAxis.appendChild(tick);
    });
  }

  // ── Summary Table Calculation ─────────────────────
  function calculateAndRenderTable(originalProcesses, scheduledSequence, algorithm) {
    resultsTbody.innerHTML = '';
    resultsTfoot.innerHTML = '';

    const calculated = originalProcesses.map(p => ({
      ...p,
      waitingTime: 0,
      turnaroundTime: 0
    }));

    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;

    if (algorithm === 'FCFS') {
      // FCFS: simple cumulative time calculation
      const sorted = [...calculated].sort((a, b) => a.arrival_time - b.arrival_time);
      let cumulativeTime = 0;

      sorted.forEach(process => {
        if (process.arrival_time === -1) return;
        if (process.arrival_time > cumulativeTime) {
          cumulativeTime = process.arrival_time;
        }

        process.waitingTime = Math.max(0, cumulativeTime - process.arrival_time);
        process.turnaroundTime = process.waitingTime + process.burst_time;
        cumulativeTime += process.burst_time;

        totalWaitingTime += process.waitingTime;
        totalTurnaroundTime += process.turnaroundTime;
      });
    } else {
      // For SJF, SRTF, RR: use intervals from scheduled sequence
      calculated.forEach(process => {
        const intervals = scheduledSequence.filter(sp => sp.process_id === process.process_id);

        let processStartTime = process.arrival_time;
        let wt = 0;

        intervals.forEach(interval => {
          if (processStartTime < interval.arrival_time) {
            wt += interval.arrival_time - processStartTime;
          }
          processStartTime = interval.arrival_time + interval.burst_time;
        });

        const tat = wt + intervals.reduce((sum, iv) => sum + iv.burst_time, 0);

        process.waitingTime = wt;
        process.turnaroundTime = tat;

        totalWaitingTime += wt;
        totalTurnaroundTime += tat;
      });
    }

    // Render table rows
    calculated.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="process-id-badge" style="background:${p.background}">${p.process_id}</span></td>
        <td>${p.arrival_time}</td>
        <td>${p.burst_time}</td>
        <td>${p.waitingTime}</td>
        <td>${p.turnaroundTime}</td>
      `;
      resultsTbody.appendChild(tr);
    });

    // Total row
    const tfoot = document.createElement('tr');
    tfoot.innerHTML = `
      <td colspan="3">Total</td>
      <td>${totalWaitingTime}</td>
      <td>${totalTurnaroundTime}</td>
    `;
    resultsTfoot.appendChild(tfoot);

    // ── Summary Statistics ──────────────────────────
    const n = originalProcesses.length;

    // CPU Utilization
    const totalBurst = scheduledSequence.reduce((sum, p) => p.arrival_time !== -1 ? sum + p.burst_time : sum, 0);
    const startTime = Math.min(...scheduledSequence.map(p => p.arrival_time).filter(t => t >= 0));
    const totalExec = scheduledSequence.reduce((sum, p) => sum + p.burst_time, 0);

    const cpuUtil = (totalBurst / totalExec) * 100;
    const throughput = n / totalExec;

    summaryStats.innerHTML = `
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Avg Waiting Time</span>
          <span class="stat-value">${Math.round((totalWaitingTime / n) * 100) / 100}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Turnaround Time</span>
          <span class="stat-value">${Math.round((totalTurnaroundTime / n) * 100) / 100}</span>
        </div>
      </div>
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Throughput</span>
          <span class="stat-value">${Math.round(throughput * 100) / 100}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">CPU Utilization</span>
          <span class="stat-value">${Math.round(cpuUtil * 100) / 100}%</span>
        </div>
      </div>
    `;
  }

  // ── Submit / Simulate ─────────────────────────────
  function simulate() {
    const algo = algoSelect.value;
    if (!algo) {
      alert('Please select an algorithm to display.');
      return;
    }
    if (processes.length === 0) {
      alert('No processes added!');
      return;
    }

    let sequence = [];
    switch (algo) {
      case 'FCFS': sequence = firstComeFirstServe(processes); break;
      case 'SJF':  sequence = shortestJobFirst(processes); break;
      case 'RR':   sequence = roundRobin(processes, parseInt(quantumInput.value) || 2); break;
      case 'SRTF': sequence = shortestRemainingTimeFirst(processes); break;
    }

    resultsSection.style.display = '';
    renderGantt(sequence);
    calculateAndRenderTable(processes, sequence, algo);

    // Smooth scroll to results
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  btnSubmit.addEventListener('click', simulate);

  // ── Add Process button ────────────────────────────
  btnAddProcess.addEventListener('click', openAddModal);

  // ── Clear all ─────────────────────────────────────
  btnClear.addEventListener('click', () => {
    processes = [];
    renderProcessList();
    resultsSection.style.display = 'none';
  });

  // ── Random processes ──────────────────────────────
  btnRandom.addEventListener('click', () => {
    const count = 3 + Math.floor(Math.random() * 3); // 3-5
    const newProcs = [];
    for (let i = 0; i < count; i++) {
      newProcs.push({
        process_id: i + 1,
        arrival_time: Math.floor(Math.random() * 10),
        burst_time: 1 + Math.floor(Math.random() * 10),
        background: randomColor()
      });
    }
    newProcs.sort((a, b) => a.arrival_time - b.arrival_time);
    newProcs.forEach((p, i) => { p.process_id = i + 1; });
    processes = newProcs;
    renderProcessList();
  });

  // ── Share ─────────────────────────────────────────
  btnShare.addEventListener('click', async () => {
    if (processes.length === 0 || !algoSelect.value) {
      alert('Add processes and select an algorithm first!');
      return;
    }
    const params = new URLSearchParams();
    params.set('algo', algoSelect.value);
    if (algoSelect.value === 'RR') {
      params.set('quantum', quantumInput.value);
    }
    params.set('processes', encodeURIComponent(JSON.stringify(processes)));
    const url = window.location.origin + window.location.pathname + '?' + params.toString();
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch {
      prompt('Copy this link:', url);
    }
  });

  // ── Load from URL params ──────────────────────────
  (function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const algo = params.get('algo');
    const quantum = params.get('quantum');
    const procs = params.get('processes');

    if (algo) {
      algoSelect.value = algo;
      algoSelect.dispatchEvent(new Event('change'));
    }
    if (quantum && algo === 'RR') {
      quantumInput.value = quantum;
    }
    if (procs) {
      try {
        const decoded = decodeURIComponent(procs);
        let parsed;
        try { parsed = JSON.parse(decoded); } catch { parsed = JSON.parse(decodeURIComponent(decoded)); }
        if (Array.isArray(parsed)) {
          processes = parsed;
          renderProcessList();
          if (algo && processes.length > 0) {
            setTimeout(simulate, 200);
          }
        }
      } catch (e) {
        console.error('Failed to parse processes from URL:', e);
      }
    }
  })();

})();
