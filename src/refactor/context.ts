import React from 'react'
import {Fixed, VirtualTableContext} from './interfaces'

export const C = React.createContext<VirtualTableContext>({head: 0, tail: 0, fixed: Fixed.UNKNOWN})
