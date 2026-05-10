export class DLLNode<T> {
  value: T;
  next: DLLNode<T> | null = null;
  prev: DLLNode<T> | null = null;
  index: number;

  constructor(value: T, index: number) {
    this.value = value;
    this.index = index;
  }
}

export class CircularDoublyLinkedList<T> {
  head: DLLNode<T> | null = null;
  tail: DLLNode<T> | null = null;
  length: number = 0;

  constructor(items: T[]) {
    items.forEach((item, index) => this.append(item, index));
    if (this.length > 1) {
      this.makeCircular();
    }
  }

  private append(value: T, index: number) {
    const newNode = new DLLNode(value, index);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  private makeCircular() {
    if (this.head && this.tail) {
      this.head.prev = this.tail;
      this.tail.next = this.head;
    }
  }

  /**
   * Returns a window of nodes centered around the given node.
   * Useful for rendering the current slide and its neighbors.
   */
  static getWindow<T>(centerNode: DLLNode<T>, size: number = 3): DLLNode<T>[] {
    if (size % 2 === 0) throw new Error("Window size must be odd to have a clear center.");
    
    const half = Math.floor(size / 2);
    const result: DLLNode<T>[] = [];
    
    // Start from the leftmost node in the window
    let current = centerNode;
    for (let i = 0; i < half; i++) {
      if (current.prev) current = current.prev;
    }
    
    // Fill the window
    for (let i = 0; i < size; i++) {
      result.push(current);
      if (current.next) current = current.next;
    }
    
    return result;
  }
}
