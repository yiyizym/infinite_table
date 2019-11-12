import React, {ReactNode} from "react";

interface ObjWithAny {
    [key: string]: any
}

export enum Fixed {
    UNKNOWN = -1,
    NO,
    LEFT,
    RIGHT
}

export enum ReComputeType {
    NOT_CHANGED,
    INCREASE,
    DECREASE
}

export enum RowLoadStatus {
    INIT,
    LOADED,
    RUNNING,
}

export interface StoreType extends VirtualTableOpts {
    components: {
        table: React.ElementType,
        wrapper: React.ElementType,
        row: React.ElementType
    };
    computedTbodyHeight: number;
    rowHeight: number[];
    rowCount: number;
    possibleRowHeight: number;
    reComputeCount: number;
    wrapInst: React.RefObject<HTMLDivElement>;
    context: React.Context<VirtualTableContext>;
    rowLoadStatus: RowLoadStatus;
    leftPointer: any;
    rightPointer: any;
}

export interface VirtualTableContext {
    head: number;
    tail: number;
    fixed: Fixed;
}

export interface VirtualTableProps extends ObjWithAny {
    children: ReactNode;
    style: React.CSSProperties;
}

export interface VirtualTableState {
    top: number;
    head: number;
    tail: number;
}

interface PropsWithFixed {
    props: {
        fixed: 'left'|'right'|undefined;
    }
}

export interface PropsType {
    children: PropsWithFixed[]
}

export interface VirtualTableOpts {
    readonly id: number;
    overscanRowCount?: number;
}

interface PropsWithIndex {
    props: {
        index: number;
    }
}

export interface VirtualTableRowProps {
    children: PropsWithIndex[]
}


export interface VirtualTableWrapperProps {
    children: any[];
}
