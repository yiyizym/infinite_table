import React from 'react';
import InfinityTable from './infiniteTable'
import { Button, Col, Row } from 'antd';
import { ColumnProps } from 'antd/lib/table';

interface StateType {
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
}]

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
}

class App extends React.Component<{}, StateType> {
  public state = { 
    data: genData(49)
  }
  public render(): JSX.Element {
    const {data} = this.state
    return (
      <Row >
        <Col span={20} offset={2}>
          <InfinityTable
            rowKey={(record: RecordType): string => record.id ? record.id.toString() : ''}
            scroll={{ x: 2400, y: 800 }}
            columns={columns}
            dataSource={data}
            total={data.length}
            itemHeight={57}
          />
        </Col>
      </Row>
    );
  }
}

export default App;
