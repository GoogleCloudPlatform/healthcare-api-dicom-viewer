import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {makeStyles, Box, TextField, List,
  ListItem, ListItemText, LinearProgress} from '@material-ui/core';
import _ from 'lodash';

const useStyles = makeStyles((theme) => ({
  fullWidth: {
    width: '100%',
  },
}));

/**
 * React component for creating a list of items filtered using a search query
 * @param {Object} props
 * @param {Object[]} props.items Array of items to be filtered
 * @param {string} props.items[].value
 * @param {number} props.items[].index
 * @param {string} props.searchQuery Search query to filter with
 * @param {function(string): *} props.onClickItem Function to run when
 *   user clicks an item
 * @param {number} props.maxDisplayAmount Max number of items to render
 * @return {ReactElement} <FilterItems/>
 */
function FilterItems({items, searchQuery, onClickItem, maxDisplayAmount}) {
  const filteredItems = items.filter((item) => {
    return item.value.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  return filteredItems.slice(0, maxDisplayAmount).map((item) => {
    return (
      <ListItem button key={item.index} onClick={() => onClickItem(item.index)}>
        <ListItemText
          primary={item.value} />
      </ListItem>
    );
  });
}

/**
 * React component for displaying a list of items and a search bar for filtering
 * @param {Object} props
 * @param {string[]} props.items Array of items to display
 * @param {function(string): *} props.onClickItem Function to run when
 *   user clicks an item
 * @param {boolean} props.isLoading Whether or not data is still loading
 * @param {(function(string): *)=} props.onSearch Function to override search
 *    filtering with a separate api call for example
 * @param {number=} props.searchDelay Optional override of the delay after
 *    user stops typing in search bar to execute the search
 * @return {ReactElement} <SearchList />
 */
export default function SearchList({
  items,
  onClickItem,
  isLoading,
  onSearch,
  searchDelay = 500,
}) {
  const classes = useStyles();

  const [searchQuery, setSearchQuery] = useState('');
  const [maxDisplayAmount, setMaxDisplayAmount] = useState(50);

  // Track the index of each item to retain accurate indexing even
  // after items have been filtered
  items = items.map((value, index) => ({
    value,
    index,
  }));

  // On mount, set up up scroll events to load more results as user scrolls
  useEffect(() => {
    document.addEventListener('scroll', onScroll);

    return () => {
      document.removeEventListener('scroll', onScroll);
    };
  }, []);

  /**
   * Runs when user scrolls page
   */
  const onScroll = () => {
    // Check if search list bottom is visible on page
    const searchList = document.getElementById('search-list');
    if (searchList.getBoundingClientRect().bottom <= window.innerHeight) {
      // If bottom is still visible, load more results
      setMaxDisplayAmount((prevAmount) => prevAmount + 10);
    }
  };

  /**
   * Debounce method to filter items after a period of time
   *    without user input
   * @param {string} search Search query to use for filtering
   */
  const updateSearchQuery = _.debounce((search) => {
    if (onSearch) {
      onSearch(search);
    } else {
      setSearchQuery(search);
    }
    setMaxDisplayAmount(50);
  }, searchDelay);

  /**
   * Handles a change in search query
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} event
   * onChange event
   */
  const handleSearch = (event) => {
    event.persist();
    updateSearchQuery(event.target.value);
  };

  return (
    <Box id="search-list">
      <Box pl={2} pr={2} className={classes.fullWidth}>
        <TextField label="Search" variant="outlined"
          className={classes.fullWidth}
          onChange={(e) => handleSearch(e)} />
      </Box>
      {isLoading ?
        <Box mt={1}>
          <LinearProgress />
        </Box> :
        <List>
          <FilterItems
            items={items}
            searchQuery={searchQuery}
            onClickItem={onClickItem}
            maxDisplayAmount={maxDisplayAmount} />
        </List>
      }
    </Box>
  );
}
SearchList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClickItem: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onSearch: PropTypes.func,
  searchDelay: PropTypes.number,
};
