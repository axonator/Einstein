import * as React from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import { visuallyHidden } from '@mui/utils';
import ContactForm from './form/ContactForm';
import { getcustomFields } from '../helper/helper';
import ContactDeletePopup from './common/ContactDeletePopup'
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import Button from '@mui/material/Button';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import Import from './common/Import';
import TextField from '@mui/material/TextField';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}


function EnhancedTableHead(props) {
    const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort, columns } = props;
    const headCells = columns.filter((col_name)=>(!['id','order_number'].includes(col_name))).map((key) => {
        return {
            id: key,
            numeric: typeof columns[0][key] === 'number', // Assuming numeric values are of type number
            disablePadding: false, // You can customize this depending on your needs
            label: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '), // Capitalize and replace underscores with spaces
        };
    });
    
    const createSortHandler = (property) => (event) => {
      onRequestSort(event, property);
    };
  
    return (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox">
            <Tooltip title="Select All">
                <Checkbox
                color="primary"
                indeterminate={numSelected > 0 && numSelected < rowCount}
                checked={rowCount > 0 && numSelected === rowCount}
                onChange={onSelectAllClick}
                inputProps={{
                    'aria-label': 'select all Contacts',
                }}
                />
            </Tooltip>
          </TableCell>
          {headCells.map((column) => (
            <TableCell
              key={column.id}
              align={column.align || 'left'}
              sortDirection={orderBy === column.id ? order : false}
              >
              <TableSortLabel
                active={orderBy === column.id}
                direction={orderBy === column.id ? order : 'asc'}
                onClick={createSortHandler(column.id)}
                >
                {column.label}
                {orderBy === column.id ? (
                  <Box component="span" sx={visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </Box>
                ) : null}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    );
  }
  

EnhancedTableHead.propTypes = {
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

export default function Contact({table_name="contact", columns = '*', condition = '', showTools = true, campaignDetails=false}) {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('name');
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  // const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [contacts, setContacts] = React.useState([]);
  const [COLUMNS, setcolumns] = React.useState([]);
  const [totalContacts, settotalContacts] = React.useState(0)
  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [availableCustomFields,setavailableCustomFields] = React.useState([]);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [Deletemessage, setDeleteMessage] = React.useState(null);
  const [DeletemessageType, setDeleteMessageType] = React.useState(""); 
  const [openImportContacts, setOpenImportContacts] = React.useState(false);
  const [totalPages, setTotalPages] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState("");

  

  const ExcludeColumns = ['id', 'first_name', 'last_name', 'order_number', 'body', 'subject', 'status','date_to_send',"time_to_send"]

  async function getContacts() {
    // const response = await axios.get(`${import.meta.env.VITE_LOCAL_URL}/api/contacts`);
    if (searchQuery) {
      if (condition.length > 1) {
        condition += ` AND (first_name LIKE '%${searchQuery}%' OR last_name LIKE '%${searchQuery}%')`; 
      }else{
        condition = `WHERE first_name LIKE '%${searchQuery}%' OR last_name LIKE '%${searchQuery}%'`; 
      }
    }
    
    const response = await fetch(`${import.meta.env.VITE_LOCAL_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          { 
            page_size : rowsPerPage,
            page_number : page + 1,
            TableName : table_name,
            Columns : columns,
            Condition : condition,
          }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      
      const {allcontacts, total, tableColumns} = await response.json();

      setContacts(allcontacts);
      setcolumns(tableColumns)
      settotalContacts(total)
      setTotalPages(Math.ceil(total / rowsPerPage) - 1)
      const data = await getcustomFields(26,setError,setLoading);
      setavailableCustomFields(data)
    }

    // Open dialog
    const handleOpenImportContacts = () => {
        setOpenImportContacts(true);
    };


    function EnhancedTableToolbar(props) {
    const { numSelected, searchQuery, setSearchQuery } = props;
    const [localSearchQuery, setLocalSearchQuery] = React.useState(searchQuery);
    React.useEffect(() => {
        const delaySearch = setTimeout(() => {
            setSearchQuery(localSearchQuery);
        }, 500); // Update searchQuery after 500ms

        return () => clearTimeout(delaySearch);
    }, [localSearchQuery]);
    return (
        <Toolbar
        sx={[
            {
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            },
            numSelected > 0 && {
            bgcolor: (theme) =>
                alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
            },
        ]}
        >
        {numSelected > 0 ? (
            <Typography
            sx={{ flex: '1 1 100%' }}
            color="inherit"
            variant="subtitle1"
            component="div"
            >
            {numSelected} selected
            </Typography>
        ) : (
            <Typography
            sx={{ flex: '1 1 100%' }}
            variant="h6"
            id="tableTitle"
            component="div"
            className='d-flex align-items-center'
            >
            Contacts
            {showTools && 
              <Tooltip title = "Add Contact">
                  <IconButton size='small' className='ms-1' onClick={toggleModal}>
                      <PersonAddAlt1RoundedIcon/>
                  </IconButton>
              </Tooltip>
            }
            </Typography>
        )}
            
        {numSelected > 0 ? (
            <Tooltip title="Delete">
            <IconButton onClick={() => setShowDeleteModal(true)}>
                <DeleteIcon />
            </IconButton>
            </Tooltip>
            
        ) : (
          showTools && 
            <div className='d-flex'>
                <Button variant="outlined" className='me-2 rounded' size='small' onClick={handleOpenImportContacts} startIcon={<CloudDownloadIcon />}>
                    Import
                </Button>
                <Tooltip title="Filter list">
                <IconButton>
                    <FilterListIcon />
                </IconButton>
                </Tooltip>
              </div>
        )}
        </Toolbar>
    );
    }

  React.useEffect(() => {
    getContacts();
  }, []);

  React.useEffect(() => {
    getContacts();
  }, [page, rowsPerPage]); // Re-fetch when page or rows per page changes

  React.useEffect(() => {
    const delaySearch = setTimeout(() => {
        getContacts();
    }, 1000); // Delays API request by 500ms

    return () => clearTimeout(delaySearch); // Cleanup function to prevent multiple calls
}, [searchQuery]);

  EnhancedTableToolbar.propTypes = {
    numSelected: PropTypes.number.isRequired,
  };

  const toggleModal = () => {
    setShowForm(!showForm);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = contacts.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // const handleChangeDense = (event) => {
  //   setDense(event.target.checked);
  // };

  function handleDelte(message,messageType) {
    
    setDeleteMessage(message);
    setDeleteMessageType(messageType);
    setTimeout(() => {
        setDeleteMessage(null); // Close modal after showing success
      }, 2000);
  }

  const handlePageJump = (e) => {
    setPage(parseInt(e.target.value, 10));
  };
  
  return (
    <Box sx={{ width: '100%' }} className="noshadow">
        
            <TextField
                label="Search Contactsss"
                variant="outlined"
                size="small"
                value={searchQuery}
                className='my-2'
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ ml: 2, width: '40%' }}
            />
        {Deletemessage && (
            <Alert icon={DeletemessageType === "success" ? <CheckIcon fontSize="inherit" /> : null} severity={DeletemessageType} className='mb-2'>
                {Deletemessage}
            </Alert>
        )}
      <Paper sx={{ width: '100%', mb: 2, boxShadow: 'none' }}>
        <EnhancedTableToolbar numSelected={selected.length} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <TableContainer>
          <Table
            sx={{ minWidth: 750 }}
            aria-labelledby="tableTitle"
            size='medium'
          >
            <EnhancedTableHead
            columns={COLUMNS}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={totalContacts}
            />
            <TableBody>
              {contacts
                .sort(getComparator(order, orderBy))
                .map((row, index) => {
                  const isItemSelected = selected.includes(row.id);
                  const labelId = `enhanced-table-checkbox-${index}`;

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.id)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.id}
                      id={row.id}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                      ordernumber={row.order_number}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          inputProps={{
                            'aria-labelledby': labelId,
                          }}
                        />
                      </TableCell>
                      
                      <TableCell component="th" id={labelId} scope="row" align="left" >{row.first_name}</TableCell>
                      <TableCell align="left">{row.last_name}</TableCell>
                      {campaignDetails ?
                        <>
                          <TableCell align="left">{row.body}</TableCell>
                          <TableCell align="left">{row.subject}</TableCell>
                          <TableCell align="left">{row.status}</TableCell>
                          <TableCell align="left">{row.date_to_send}</TableCell>
                          <TableCell align="left">{row.time_to_send}</TableCell>

                        </>
                       :
                       null
                      }
                      {COLUMNS.filter(column_name => !ExcludeColumns.includes(column_name))
                          .map((column_name) => (
                              <TableCell key={column_name} align="left">
                                  {row.custom_fields?.[column_name]?.value || ""}
                              </TableCell>
                          ))}

                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <div className='row mt-2'>
            <div className='col-1'>
                {
                    totalPages > 0 &&
                    <select 
                        className="form-select w-auto ms-2" 
                        value={page} 
                        onChange={handlePageJump}>
                        {[...Array(totalPages)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                        ))}
                    </select>
                }
            </div>
            <div className='col'>
                <TablePagination
                rowsPerPageOptions={[5, 10, 20, 30, 50 ,75, 100 ,{ label: "All", value: totalContacts }]}
                component="div"
                count={totalContacts}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </div>
        </div>
      </Paper>
      {/* <FormControlLabel
        control={<Switch checked={dense} onChange={handleChangeDense} />}
        label="Dense padding"
      /> */}
      {showForm &&
        <ContactForm 
            toggleModal={toggleModal} 
            refreshTasks={getContacts} 
            selectedTabId={1} 
            selectedTabName={"Contact"} 
            availableCustomFields={availableCustomFields} 
            taskToEdit={null}
            campaignDetails = {campaignDetails}
            />
      }
      {/* Conditional Rendering of DeletePopup */}
      {showDeleteModal && (
        <ContactDeletePopup
          contactIDs={selected}
          fetchContacts={getContacts}
          onclose={setShowDeleteModal} // Close modal handler
          setcontactIDs = {setSelected}
          onDelete = {handleDelte}
        />
      )}

      {openImportContacts && 
            <Import refreshContacts={getContacts} setOpenImportContacts={setOpenImportContacts} OpenImportContacts={openImportContacts} campaignDetails={campaignDetails}/>
      }
      
    </Box>
  );
}
