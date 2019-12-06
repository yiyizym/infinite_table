import {FixedStoreType, StoreType} from './interfaces'

let currentID = 0

const Store: Map<number, StoreType | FixedStoreType> = new Map()


export const setCurrentID = (id: number): void => { currentID = id}
export const getCurrentID = (): number => { return currentID}

export default Store
