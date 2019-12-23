import React from 'react';
import InfinityTable from './infiniteTable'
import {Button, Col, Row, Table} from 'antd';
import { ColumnProps } from 'antd/lib/table';
import {VTComponents} from "virtualizedtableforantd/lib";
import { VirtualComponents } from "./refactor";

interface StateType {
  num: number;
  data: object[];
}

interface RecordType {
  id: number;
  name: string;
  age: number;
  height: number;
  weight: number;
}

const columns: ColumnProps<RecordType>[] = [{
    title: 'ID',
    width: '400px',
    dataIndex: 'id',
    fixed: 'left'
  }, {
    title: 'Name',
    width: '400px',
    dataIndex: 'name'
  }, {
    title: 'Age',
    width: '400px',
    dataIndex: 'age'
  }, {
    title: 'Height',
    width: '400px',
    dataIndex: 'height'
  }, {
    title: 'Weight',
    width: '400px',
    dataIndex: 'weight'
  }, {
    title: 'Acton',
    width: '',
    dataIndex: 'action',
    render: (text: void, record: RecordType): React.ReactNode => (
      <Button type='primary' size='small'>
        action
      </Button>
    )
}];

const genData = (num: number): RecordType[] => {
  return Array.from({ length: num }, (_: void,index: number): RecordType => {
    return {
      id: index,
      name: `name_${index}`,
      age: index,
      weight: index,
      height: index
    }
  })
};

class App extends React.Component<{}, StateType> {
  public state = {
    data: genData(100),
    num: 0
  };
  public render(): JSX.Element {
    const {data, num} = this.state
    return (
      <Row >
        <Col span={20} offset={2}>
          <div
            style={{
              margin: '10px auto'
            }}
          >
            <span>click count: {num}</span>
            <button
                style={{ marginLeft: '10px' }}
                onClick={() => this.setState({num: num+1})}
            >click me</button>
          </div>
          {/*<InfinityTable*/}
          {/*    rowSelection={{*/}
          {/*      onChange: (selectedRowKeys, selectedRows) => {*/}
          {/*        console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);*/}
          {/*      },*/}
          {/*    }}*/}
          {/*  rowKey={(record: RecordType): string => record.id ? record.id.toString() : ''}*/}
          {/*  scroll={{ x: 2400, y: 800 }}*/}
          {/*  columns={columns}*/}
          {/*  dataSource={data}*/}
          {/*  itemHeight={57}*/}
          {/*/>*/}

          {/*<Table*/}
          {/*    rowSelection={{*/}
          {/*      onChange: (selectedRowKeys, selectedRows) => {*/}
          {/*        console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);*/}
          {/*      },*/}
          {/*    }}*/}
          {/*    rowKey={(record: RecordType): string => record.id ? record.id.toString() : ''}*/}
          {/*    scroll={{ x: 2400, y: 800 }}*/}
          {/*    columns={columns}*/}
          {/*    dataSource={data}*/}
          {/*    pagination={{*/}
          {/*      pageSize: 300*/}
          {/*    }}*/}
          {/*/>*/}

          <Table
              components={
                VirtualComponents({
                      id: 1000,
                      debug: true
                  })
              }
              rowSelection={{
                onChange: (selectedRowKeys, selectedRows) => {
                  console.log(`selectedRowKeys: ${selectedRowKeys}`, 'selectedRows: ', selectedRows);
                },
              }}
              rowKey={(record: RecordType): string => record.id ? record.id.toString() : ''}
              scroll={{ x: 2400, y: 800 }}
              columns={columns}
              dataSource={data}
              pagination={false}
          />
        </Col>
      </Row>
    );
  }
}

export default App;
