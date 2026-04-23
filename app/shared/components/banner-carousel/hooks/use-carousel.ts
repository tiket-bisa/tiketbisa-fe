import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CircularDoublyLinkedList, type DLLNode } from "../utils/doubly-linked-list";

interface UseCarouselOptions {
  autoPlay?: boolean;
  interval?: number;
}

export function useCarousel<T>(items: T[], options: UseCarouselOptions = {}) {
  const { autoPlay = true, interval = 5000 } = options;
  
  // Initialize Circular Doubly Linked List
  const list = useMemo(() => new CircularDoublyLinkedList(items), [items]);
  
  const [currentNode, setCurrentNode] = useState<DLLNode<T> | null>(list.head);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const next = useCallback(() => {
    if (isAnimating || !currentNode || list.length <= 1) return;
    setIsAnimating(true);
    setIsTransitioning(true);
    setDirection("next");
  }, [isAnimating, currentNode, list.length]);

  const prev = useCallback(() => {
    if (isAnimating || !currentNode || list.length <= 1) return;
    setIsAnimating(true);
    setIsTransitioning(true);
    setDirection("prev");
  }, [isAnimating, currentNode, list.length]);

  const goTo = useCallback((index: number) => {
    if (isAnimating || !currentNode || list.length <= 1) return;
    
    // Find node with specific index
    let target = list.head;
    while (target && target.index !== index) {
      target = target.next;
      if (target === list.head) break; // Avoid infinite loop just in case
    }
    
    if (target && target !== currentNode) {
      // For simplicity, direct jump might be less smooth if far away
      // but we update the node immediately for teleportation effect
      setCurrentNode(target);
    }
  }, [isAnimating, currentNode, list]);

  const handleTransitionEnd = useCallback(() => {
    if (!currentNode || !direction) return;

    // Teleport to the new node
    if (direction === "next" && currentNode.next) {
      setCurrentNode(currentNode.next);
    } else if (direction === "prev" && currentNode.prev) {
      setCurrentNode(currentNode.prev);
    }

    setIsTransitioning(false);
    setIsAnimating(false);
    setDirection(null);
  }, [currentNode, direction]);

  // Auto-play timer
  useEffect(() => {
    if (!autoPlay || list.length <= 1 || isPaused || isAnimating) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, interval, next, list.length, isPaused, isAnimating]);

  const window = useMemo(() => {
    if (!currentNode) return [];
    // We use a window of 5 to ensure we always see neighbors smoothly
    return CircularDoublyLinkedList.getWindow(currentNode, 5);
  }, [currentNode]);

  return {
    currentNode,
    window,
    isTransitioning,
    isAnimating,
    direction,
    next,
    prev,
    goTo,
    handleTransitionEnd,
    setIsPaused,
  };
}
