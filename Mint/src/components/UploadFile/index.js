import React from 'react';
import Papa from 'papaparse';

class WHONETFileReader extends React.Component {
  constructor() {
    super();
    this.state = {
      csvfile: undefined,
    };
    this.updateData = this.updateData.bind(this);
  }

  handleChange = event => {
    this.setState({
      csvfile: event.target.files[0]
    });
  };

  importCSV = () => {
    const { csvfile } = this.state;
    Papa.parse(csvfile, {
      complete: this.updateData,
      header: true
    });
  };

  updateData(result) {
    var data = result.data;
    console.log(data);
    data.pop()
    this.props.handleSetCsvData(data)
  }

  render() {
    console.log("Render File data: ", this.state.csvfile);
    return (
      <div className="App">
        <input
          className="csv-input"
          type="file"
          ref={input => {
            this.filesInput = input;
          }}
          name="file"
          placeholder={null}
          onChange={this.handleChange}
        />
        <button onClick={this.importCSV}> Import now!</button>
      </div>
    );
  }
}

export default WHONETFileReader;