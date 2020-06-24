import React from 'react';
import {render, fireEvent, waitFor, screen} from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SearchList from '../../src/components/searchlist.js';

/**
 * Helper function -
 *    Returns an array of items labeled as so: item1, item2...
 * @param {number} numItems Number of items to generate
 * @return {string[]} List of numbered items
 */
const generateItems = (numItems) => {
  const items = [];
  for (let i = 1; i <= numItems; i++) {
    items.push('item' + i);
  }
  return items;
};

test('Items do not display until data is done loading', () => {
  const items = generateItems(10);
  const {rerender} = render(
      <SearchList items={items} onClickItem={() => {}} isLoading={true}/>,
  );

  // Ensure no items are displayed
  expect(screen.queryAllByText('item', {exact: false})).toHaveLength(0);

  // Set isLoading=false and check items again
  rerender(
      <SearchList items={items} onClickItem={() => {}} isLoading={false}/>,
  );
  expect(screen.getAllByText('item', {exact: false})).toHaveLength(10);
});

test('Only first 50 items are displayed until user scrolls', () => {
  const items = generateItems(70);
  render(
      <SearchList items={items} onClickItem={() => {}} isLoading={false}/>,
  );

  expect(screen.getAllByText('item', {exact: false})).toHaveLength(50);

  // Scrolling should increase list size by 10
  fireEvent.scroll(document, {target: {scrollY: 100}});
  expect(screen.getAllByText('item', {exact: false})).toHaveLength(60);

  // Scroll again to ensure all items are displayed
  fireEvent.scroll(document, {target: {scrollY: 100}});
  expect(screen.getAllByText('item', {exact: false})).toHaveLength(70);
});

test('onClickItem callback returns item3 when item3 is clicked', (done) => {
  const items = generateItems(5);
  const onClickItem = (item) => {
    expect(item).toBe('item3');
    done();
  };

  render(
      <SearchList items={items} onClickItem={onClickItem} isLoading={false}/>,
  );

  // Click item3 to trigger onClickItem
  fireEvent.click(screen.getByText('item3'));
});

test('Typing in search bar filters items', async () => {
  const items = generateItems(60);
  render(
      <SearchList items={items} onClickItem={() => {}} isLoading={false}/>,
  );

  // Searching for item10 should filter to only one item
  fireEvent.input(screen.getByRole('textbox'), {target: {value: 'item10'}});
  await waitFor(() =>
    expect(screen.getAllByText('item', {exact: false})).toHaveLength(1), {timeout: 2000});

  // Searching for item6 should filter to two items (item6 and item60)
  fireEvent.input(screen.getByRole('textbox'), {target: {value: 'item6'}});
  await waitFor(() =>
    expect(screen.getAllByText('item', {exact: false})).toHaveLength(2), {timeout: 2000});

  // Searching for blank space should return all items (only 50 will be
  // displayed as that is the initial max number of items until scroll)
  fireEvent.input(screen.getByRole('textbox'), {target: {value: ' '}});
  await waitFor(() =>
    expect(screen.getAllByText('item', {exact: false})).toHaveLength(50), {timeout: 2000});

  // Searching for item70 should yield no items
  fireEvent.input(screen.getByRole('textbox'), {target: {value: 'item70'}});
  await waitFor(() =>
    expect(screen.queryAllByText('item', {exact: false})).toHaveLength(0), {timeout: 2000});
}, 20000);
