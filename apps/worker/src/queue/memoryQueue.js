const queue = [];

export function enqueue(job) {
  queue.push(job);
}

export function dequeue() {
  return queue.shift() || null;
}

export function size() {
  return queue.length;
}

export function clear() {
  queue.length = 0;
}
