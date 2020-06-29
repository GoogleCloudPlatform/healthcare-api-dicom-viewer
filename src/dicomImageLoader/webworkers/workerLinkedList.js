import DicomWorker from './dicom.worker.js';

/**
 * Linked list implementation for a worker pool
 */
class WorkerLinkedList {
  /**
   * Creates an empty WorkerLinkedList
   */
  constructor() {
    /**
     * Head of the linked list
     * @type {?WorkerNode}
     */
    this.head = null;

    /**
     * Tail of the linked list
     * @type {?WorkerNode}
     */
    this.tail = null;
  }

  /**
   * Adds a new worker node to the end of the list
   * @return {WorkerNode} new worker node
   */
  addNewWorker() {
    const node = new WorkerNode();
    if (this.head == null) {
      this.head = node;
      this.tail = node;
      return node;
    }

    this.tail.next = node;
    node.prev = this.tail;
    this.tail = node;
    return node;
  }

  /**
   * Incremements a worker nodes tasks and changes it's
   *    position in the list to reflect task order
   * @param {WorkerNode} worker Worker to increment
   */
  incrementTasks(worker) {
    worker.activeTasks++;
    while (worker.next && worker.next.activeTasks < worker.activeTasks) {
      const tempNext = worker.next.next;
      worker.next.prev = worker.prev;
      worker.next.next = worker;
      if (worker.prev) {
        worker.prev.next = worker.next;
      }
      worker.prev = worker.next;
      worker.next = tempNext;
      if (worker.next) {
        worker.next.prev = worker;
      } else {
        this.tail = worker;
      }

      if (this.head == worker) {
        this.head = worker.prev;
      }
    }
  }

  /**
   * Decrements a worker nodes tasks and changes it's
   *    position in the list to reflect task order
   * @param {WorkerNode} worker Worker to decrement
   */
  decrementTasks(worker) {
    worker.activeTasks--;
    while (worker.prev && worker.prev.activeTasks > worker.activeTasks) {
      const tempPrev = worker.prev.prev;
      worker.prev.next = worker.next;
      worker.prev.prev = worker;
      if (worker.next) {
        worker.next.prev = worker.prev;
      }
      worker.next = worker.prev;
      worker.prev = tempPrev;
      if (worker.prev) {
        worker.prev.next = worker;
      } else {
        this.head = worker;
      }

      if (this.tail == worker) {
        this.tail = worker.next;
      }
    }
  }

  /**
   * Prints the current state of the linked list for debugging
   */
  printList() {
    console.log(`Head: ${this.head} Active Tasks: ${this.head.activeTasks}`);
    console.log(`Tail: ${this.tail} Active Tasks: ${this.tail.activeTasks}`);
    let worker = this.head;
    let counter = 0;
    while (worker) {
      console.log(`${counter++}: Active Tasks: ${worker.activeTasks} ` +
      `Next: ${worker.next} Prev: ${worker.prev}`);
      worker = worker.next;
    }
  }
}

/**
 * A worker node in a worker linked list
 */
class WorkerNode {
  /**
   * Creates a new dicom worker
   */
  constructor() {
    /** @type {?WorkerNode} */
    this.next = null;
    /** @type {?WorkerNode} */
    this.prev = null;
    this.worker = new DicomWorker();
    this.activeTasks = 0;
  }
}

export default WorkerLinkedList;
