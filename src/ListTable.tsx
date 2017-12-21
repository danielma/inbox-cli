import * as React from "react"
import { flipArray, padRight } from "./utils"

interface ListTableProps {
  data: string[][]
  passthroughRef?(BlessedListInstance): void
}

export default function ListTable(props: ListTableProps & BlessedListWithoutItems) {
  const { data, passthroughRef, ...rest } = props
  const flipped = flipArray(data)

  const maxes = flipped.map(c => Math.max(...c.map(x => x.length)))

  return (
    <list
      {...rest}
      ref={passthroughRef}
      items={data.map(row => row.map((column, index) => padRight(column, maxes[index])).join(" "))}
    />
  )
}
