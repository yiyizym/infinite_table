import {StoreType, VirtualTableOpts} from "@/refactor/interfaces";
import Store, {setCurrentID} from "@/refactor/store";
import {TableComponents} from "antd/es/table";
import VirtualTable from "@/refactor/VirtualTable";
import VirtualTableWrapper from "@/refactor/VirtualTableWrapper";
import VirtualTableRow from "@/refactor/VirtualTableRow";

const init = (id: number): StoreType => {
    setCurrentID(id);
    const inner = Store.get(id) || {} as StoreType;
    if(!inner.components) {
        Store.set(id, inner);
        inner.components = { table: VirtualTable, wrapper: VirtualTableWrapper, row: VirtualTableRow };
    }

    return inner;
}


export const VirtualComponents = (opts: VirtualTableOpts): TableComponents => {
    const inner = init(opts.id);
    return {
        table: inner.components.table,
        body: {
            wrapper: inner.components.wrapper,
            row: inner.components.row
        }
    }
}
