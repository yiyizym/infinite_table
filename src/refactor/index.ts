import {Store, VirtualTableOpts} from "@/refactor/interfaces";
import store from "@/refactor/store";
import {TableComponents} from "antd/es/table";
import VirtualTable from "@/refactor/VirtualTable";

const init = (id: number): Store => {
    const inner = store.get(id) || {} as Store;

    if(!inner.components) {
        store.set(id, inner);
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
