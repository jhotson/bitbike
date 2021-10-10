import React from 'react'
import {Table} from 'react-bootstrap'

export default function DataTable({csvData}) {
  console.log(csvData);
  return(
    <Table striped bordered hover variant="dark">
      <thead>
        {csvData[0] &&
          <tr>
            <th>Glasses</th>
            <th>Hats</th>
            <th>Eyes</th>
            <th>Shirt</th>
            <th>Color</th>
            <th>Background</th>
          </tr>
        }
      </thead>
      <tbody>
        {csvData[0] && 
          csvData.map((val, key) => (
            <tr key={key}>
              <td>{val.Glasses}</td>
              <td>{val.Hats}</td>
              <td>{val.Eyes}</td>
              <td>{val.Shirt}</td>
              <td>{val.Color}</td>
              <td>{val.Background}</td>
            </tr>
          ))
        }
      </tbody>
    </Table>
  )
}