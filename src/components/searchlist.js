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
 * @param {string[] | Object[]} props.items Array of items to be filtered
 * @param {string} props.searchQuery Search query to filter with
 * @param {function(string): *} props.onClickItem Function to run when
 *   user clicks an item
 * @param {number} props.maxDisplayAmount Max number of items to render
 * @return {ReactElement} <FilterItems/>
 */
function FilterItems({items, searchQuery, onClickItem, maxDisplayAmount}) {
  const filteredItems = items.filter((item) => {
    if (typeof item == 'string') {
      return item.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return item.displayValue.toLowerCase()
        .includes(searchQuery.toLowerCase().trim());
  });

  return filteredItems.slice(0, maxDisplayAmount).map((item, index) => {
    return (
      <ListItem button key={index} onClick={() => onClickItem(item)}>
        <ListItemText
          primary={typeof item == 'string' ? item : item.displayValue} />
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
 * @return {ReactElement} <SearchList />
 */
export default function SearchList({items, onClickItem, isLoading}) {
  const classes = useStyles();

  const [searchQuery, setSearchQuery] = useState('');
  const [maxDisplayAmount, setMaxDisplayAmount] = useState(50);

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
   * Handles a change in search query
   * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} event
   * onChange event
   */
  const handleSearch = (event) => {
    event.persist();

    const updateSearchQuery = _.debounce(() => {
      setSearchQuery(event.target.value);
      setMaxDisplayAmount(50);
    }, 500);

    updateSearchQuery();
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
  items: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string).isRequired,
    PropTypes.arrayOf(PropTypes.shape({
      displayValue: PropTypes.string.isRequired,
    }))]).isRequired,
  onClickItem: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};
