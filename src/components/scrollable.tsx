import React, { useState, useEffect, useMemo } from "react"
import { Box, Text, useInput, type BoxProps } from "ink"

interface ScrollableProps<T> extends BoxProps {
  items: (T | T[])[]
  itemHeight?: number
  visibleItems: number
  isActive?: boolean
  renderItem: (item: T, isSelected: boolean) => React.ReactNode
  onSelect?: (item: T, rowIndex: number, columnIndex: number) => void | Promise<void>
}

const VERTICAL_BAR = "│"

const ScrollThumb: React.FC<{
  show: boolean
  position: number
  height: number
  totalHeight: number
}> = ({ show, position, height, totalHeight }) => {
  if (!show) return null
  return (
    <Box flexDirection="column" marginLeft={1} height={totalHeight}>
      {Array(position)
        .fill(VERTICAL_BAR)
        .map((char, i) => (
          <Text color="gray" dimColor key={`space-${i}`}>
            {char}
          </Text>
        ))}
      {Array(height)
        .fill(VERTICAL_BAR)
        .map((char, i) => (
          <Text color="gray" key={`thumb-${i}`}>
            {char}
          </Text>
        ))}
      {Array(Math.max(0, totalHeight - position - height))
        .fill(VERTICAL_BAR)
        .map((char, i) => (
          <Text color="gray" dimColor key={`space-${i}`}>
            {char}
          </Text>
        ))}
    </Box>
  )
}

export function Scrollable<T>({
  items,
  itemHeight = 3,
  visibleItems,
  isActive = true,
  renderItem,
  onSelect,
  flexGrow = 1,
  ...props
}: ScrollableProps<T>) {
  const processedItems = useMemo(() => {
    return items.map((item) => (Array.isArray(item) ? item : [item]))
  }, [items])

  const [currentRowIndex, setCurrentRowIndex] = useState(0)
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0)
  const [viewportRowStart, setViewportRowStart] = useState(0)

  useEffect(() => {
    if (currentRowIndex < viewportRowStart) {
      setViewportRowStart(currentRowIndex)
    } else if (currentRowIndex >= viewportRowStart + visibleItems) {
      setViewportRowStart(currentRowIndex - visibleItems + 1)
    }
  }, [currentRowIndex, viewportRowStart, visibleItems])

  useInput(
    (input, key) => {
      if (key.upArrow) {
        setCurrentRowIndex((prev) => Math.max(0, prev - 1))
        setCurrentColumnIndex(0)
      } else if (key.downArrow) {
        setCurrentRowIndex((prev) => Math.min(processedItems.length - 1, prev + 1))
        setCurrentColumnIndex(0)
      } else if (key.leftArrow) {
        setCurrentColumnIndex((prev) => Math.max(0, prev - 1))
      } else if (key.rightArrow) {
        const currentRow = processedItems[currentRowIndex]
        if (currentRow) {
          setCurrentColumnIndex((prev) => Math.min(currentRow.length - 1, prev + 1))
        }
      } else if (key.return) {
        const currentRow = processedItems[currentRowIndex]
        if (currentRow) {
          const selectedItem = currentRow[currentColumnIndex]
          if (selectedItem) {
            onSelect && onSelect(selectedItem, currentRowIndex, currentColumnIndex)
          }
        }
      }
    },
    { isActive: isActive },
  )

  const listItems = useMemo(() => {
    return processedItems
      .slice(viewportRowStart, viewportRowStart + visibleItems)
      .map((row, rowIndex) => {
        const isRowSelected = viewportRowStart + rowIndex === currentRowIndex
        return (
          <Box key={rowIndex} flexDirection="column" justifyContent="center" gap={0}>
            {row.map((item, columnIndex) => {
              const isItemSelected = isRowSelected && columnIndex === currentColumnIndex
              return (
                <Box key={`${rowIndex}-${columnIndex}`} flexDirection="column">
                  {renderItem(item, isItemSelected)}
                </Box>
              )
            })}
          </Box>
        )
      })
  }, [
    currentColumnIndex,
    currentRowIndex,
    processedItems,
    renderItem,
    viewportRowStart,
    visibleItems,
  ])

  const totalVisibleHeight = visibleItems * itemHeight
  const scrollThumbHeight = Math.max(
    itemHeight,
    Math.floor((visibleItems / processedItems.length) * totalVisibleHeight),
  )
  const scrollThumbPosition = Math.floor(
    (viewportRowStart / (processedItems.length - visibleItems)) *
      (totalVisibleHeight - scrollThumbHeight),
  )

  return (
    <Box flexDirection="row" flexGrow={flexGrow}>
      <Box flexDirection="column" justifyContent="flex-start" overflowY="hidden" gap={0} {...props}>
        {listItems}
      </Box>
      <ScrollThumb
        show={processedItems.length > visibleItems}
        position={scrollThumbPosition}
        height={scrollThumbHeight}
        totalHeight={totalVisibleHeight}
      />
    </Box>
  )
}
