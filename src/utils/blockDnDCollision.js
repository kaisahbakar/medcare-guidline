import {
  closestCenter,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core'

/**
 * Collision order tuned for manual blocks with very different heights.
 * `closestCorners` biases toward large rectangles; pointer + rect overlap feel tighter.
 */
export function blockSortableCollisionDetection(args) {
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions.length > 0) {
    return pointerCollisions
  }

  const intersectionCollisions = rectIntersection(args)
  if (intersectionCollisions.length > 0) {
    return intersectionCollisions
  }

  return closestCenter(args)
}
