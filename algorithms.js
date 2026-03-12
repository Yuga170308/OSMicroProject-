// ──────────────────────────────────────────────
// CPU Scheduling Algorithm Implementations
// Ported from the reference TypeScript source
// Each returns a flat array of Process objects:
//   { process_id, arrival_time, burst_time, background }
// Idle gaps use process_id = -1, arrival_time = -1
// ──────────────────────────────────────────────

/**
 * First Come First Serve (FCFS)
 */
function firstComeFirstServe(processes) {
  const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
  const result = [];
  let currentTime = 0;

  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (p.arrival_time > currentTime) {
      result.push({
        process_id: -1,
        arrival_time: -1,
        burst_time: p.arrival_time - currentTime,
        background: 'transparent'
      });
      currentTime = p.arrival_time;
    }
    result.push({ ...p });
    currentTime += p.burst_time;
  }
  return result;
}

/**
 * Shortest Job First (SJF) — Non-preemptive
 */
function shortestJobFirst(processes) {
  const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
  const result = [];
  const available = [];
  let currentTime = 0;
  let index = 0;

  while (index < sorted.length || available.length > 0) {
    while (index < sorted.length && sorted[index].arrival_time <= currentTime) {
      available.push(sorted[index]);
      index++;
    }

    if (available.length > 0) {
      available.sort((a, b) => a.burst_time - b.burst_time);
      const next = available.shift();
      result.push({ ...next, arrival_time: currentTime });
      currentTime += next.burst_time;
    } else {
      const next = sorted[index];
      const gap = next.arrival_time - currentTime;
      result.push({
        process_id: -1,
        arrival_time: -1,
        burst_time: gap,
        background: 'transparent'
      });
      currentTime += gap;
    }
  }

  // Merge consecutive same-process entries
  const merged = [];
  for (let i = 0; i < result.length; i++) {
    if (merged.length > 0 && merged[merged.length - 1].process_id === result[i].process_id) {
      merged[merged.length - 1].burst_time += result[i].burst_time;
    } else {
      merged.push({ ...result[i] });
    }
  }
  return merged;
}

/**
 * Shortest Remaining Time First (SRTF) — Preemptive SJF
 */
function shortestRemainingTimeFirst(processes) {
  const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
  const result = [];
  const queue = [];
  let currentTime = 0;
  let index = 0;

  while (queue.length > 0 || index < sorted.length) {
    // Enqueue newly arrived processes
    while (index < sorted.length && sorted[index].arrival_time <= currentTime) {
      queue.push({
        process: sorted[index],
        remaining_time: sorted[index].burst_time
      });
      index++;
    }

    queue.sort((a, b) => a.remaining_time - b.remaining_time);

    if (queue.length === 0) {
      const next = sorted[index];
      const gap = next.arrival_time - currentTime;
      result.push({
        process_id: -1,
        arrival_time: -1,
        burst_time: gap,
        background: 'transparent'
      });
      currentTime += gap;
    } else {
      const { process, remaining_time } = queue.shift();
      const executionTime = 1;

      result.push({
        ...process,
        arrival_time: currentTime,
        burst_time: executionTime
      });

      currentTime += executionTime;

      if (remaining_time > executionTime) {
        queue.push({
          process,
          remaining_time: remaining_time - executionTime
        });
      }
    }
  }

  // Merge consecutive same-process entries
  const merged = [];
  for (let i = 0; i < result.length; i++) {
    if (merged.length > 0 && merged[merged.length - 1].process_id === result[i].process_id) {
      merged[merged.length - 1].burst_time += result[i].burst_time;
    } else {
      merged.push({ ...result[i] });
    }
  }
  return merged;
}

/**
 * Round Robin (RR)
 */
function roundRobin(processes, quantum) {
  const sorted = [...processes].sort((a, b) => a.arrival_time - b.arrival_time);
  const result = [];
  const queue = [];
  let currentTime = 0;
  let index = 0;

  while (queue.length > 0 || index < sorted.length) {
    // Enqueue newly arrived processes
    while (index < sorted.length && sorted[index].arrival_time <= currentTime) {
      queue.push({
        process: sorted[index],
        remaining_time: sorted[index].burst_time
      });
      index++;
    }

    if (queue.length === 0) {
      const next = sorted[index];
      const gap = next.arrival_time - currentTime;
      result.push({
        process_id: -1,
        arrival_time: -1,
        burst_time: gap,
        background: 'transparent'
      });
      currentTime += gap;
    } else {
      const { process, remaining_time } = queue.shift();
      const executionTime = Math.min(remaining_time, quantum);

      result.push({
        ...process,
        arrival_time: currentTime,
        burst_time: executionTime
      });

      currentTime += executionTime;

      // Re-check for newly arrived processes after execution
      while (index < sorted.length && sorted[index].arrival_time <= currentTime) {
        queue.push({
          process: sorted[index],
          remaining_time: sorted[index].burst_time
        });
        index++;
      }

      if (remaining_time > quantum) {
        queue.push({
          process,
          remaining_time: remaining_time - quantum
        });
      }
    }
  }

  // Merge consecutive same-process entries
  const merged = [];
  for (let i = 0; i < result.length; i++) {
    if (merged.length > 0 && merged[merged.length - 1].process_id === result[i].process_id) {
      merged[merged.length - 1].burst_time += result[i].burst_time;
    } else {
      merged.push({ ...result[i] });
    }
  }
  return merged;
}
