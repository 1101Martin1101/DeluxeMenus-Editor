import './App.css';
import { Slot } from './slot';
import React, { Component } from 'react';
import { allItemsList, findItems } from './items-list';

export { allItemsList, findItems };

export class Search extends Component {
  state = {
    items: [],
    page: 0,
    fullResults: [],
    searchQuery: ''
  }
  componentDidMount() {
    this.updateItems('');
  }
  updateItems = (query) => {
    let results = findItems(query);
    this.setState({
      fullResults: results,
      items: results.slice(this.state.page * 54, (this.state.page + 1) * 54)
    });
  }
  handleChange = (e) => {
    const val = e.target.value;
    this.setState({ page: 0, searchQuery: val }, () => {
      this.updateItems(val);
    });
  }
  nextPage = () => {
    this.setState({ page: this.state.page + 1 }, () => {
      this.updateItems(this.state.searchQuery);
    });
  }
  prevPage = () => {
    if (this.state.page > 0) {
      this.setState({ page: this.state.page - 1 }, () => {
        this.updateItems(this.state.searchQuery);
      });
    }
  }
  render() {
    const { fullResults, items, page } = this.state;
    const totalPages = Math.ceil(fullResults.length / 54);
    const emptySlots = new Array(54 - items.length).fill({ empty: true });
    const displayItems = [...items, ...emptySlots];

    return (
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px'
          }}
        >
          <span style={{ fontWeight: 'bold' }}>{this.props.title}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
             <button className="page-btn" onClick={this.prevPage} disabled={page === 0}>&lt;</button>
             <span style={{ fontSize: '13px' }}>{page + 1} / {totalPages || 1}</span>
             <button className="page-btn" onClick={this.nextPage} disabled={page >= totalPages - 1}>&gt;</button>
          </div>
          <input
            type="text"
            name="search"
            onChange={this.handleChange}
            placeholder="Search..."
            style={{ width: '120px', margin: 0 }}
          />
        </div>
        <div
          id="itemsSearch"
        >
          {displayItems.map((itm, index) => (
            <div key={itm.id != null ? itm.id + '_s' : 'empty_' + index} onClick={() => { if (!itm.empty) this.props.selectedFromSearch(itm) }}>
              <Slot
                selectedSlot={this.props.selectedFromSearch}
                icon={itm.icon}
                isSearch={true}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

}
