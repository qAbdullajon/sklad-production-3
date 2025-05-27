import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  Tooltip,
} from "@mui/material";
import { ChevronDown, Filter, EyeOff } from "lucide-react";
import {
  useDateFilterStore,
  useProductTypeFilterStore,
  useShipperFilterStore,
  useStatusFilterStore,
} from "../hooks/useFilterStore";

export default function GlobalTable({
  columns,
  rows,
  page,
  rowsPerPage,
  total,
  onPageChange,
  totalQuantity,
}) {
  const { setValue: setStatusValue, setId: setStatusId, value: statusValue, id: statusId } =
    useStatusFilterStore();
  const { setValue: setShipperValue, setId: setShipperId, value: shipperValue, id: shipperId } =
    useShipperFilterStore();
  const { setValue: setTypeValue, setId: setTypeId, value: typeValue, id: typeId } =
    useProductTypeFilterStore();
  const { setEndDate, setStartDate, startDate, endDate } = useDateFilterStore();

  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: "asc",
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    // Initialize visibleColumns from localStorage or default to all columns visible
    try {
      const savedColumns = localStorage.getItem("visibleColumns");
      if (savedColumns) {
        return JSON.parse(savedColumns);
      }
    } catch (error) {
      console.error("Failed to parse visibleColumns from localStorage:", error);
    }
    // Default to all columns visible if no saved state or on error
    return columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {});
  });

  // Update visibleColumns when columns prop changes
  useEffect(() => {
    setVisibleColumns((prev) => {
      const newVisibleColumns = columns.reduce(
        (acc, col) => ({
          ...acc,
          [col.field]: prev[col.field] ?? true, // Preserve existing visibility or default to true
        }),
        {}
      );
      try {
        localStorage.setItem("visibleColumns", JSON.stringify(newVisibleColumns));
      } catch (error) {
        console.error("Failed to save visibleColumns to localStorage:", error);
      }
      return newVisibleColumns;
    });
  }, [columns]);

  // Initialize filter states from localStorage
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem("tableFilters");
      if (savedFilters) {
        const { status, shipper, type, dates } = JSON.parse(savedFilters);
        if (status) {
          setStatusValue(status.value || "");
          setStatusId(status.id || null);
        }
        if (shipper) {
          setShipperValue(shipper.value || "");
          setShipperId(shipper.id || null);
        }
        if (type) {
          setTypeValue(type.value || "");
          setTypeId(type.id || null);
        }
        if (dates) {
          setStartDate(dates.startDate || null);
          setEndDate(dates.endDate || null);
        }
      }
    } catch (error) {
      console.error("Failed to load filters from localStorage:", error);
    }
  }, [setStatusValue, setStatusId, setShipperValue, setShipperId, setTypeValue, setTypeId, setStartDate, setEndDate]);

  // Save filter states to localStorage whenever they change
  useEffect(() => {
    try {
      const filters = {
        status: { value: statusValue, id: statusId },
        shipper: { value: shipperValue, id: shipperId },
        type: { value: typeValue, id: typeId },
        dates: { startDate, endDate },
      };
      localStorage.setItem("tableFilters", JSON.stringify(filters));
    } catch (error) {
      console.error("Failed to save filters to localStorage:", error);
    }
  }, [statusValue, statusId, shipperValue, shipperId, typeValue, typeId, startDate, endDate]);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggleColumnVisibility = (columnField) => {
    setVisibleColumns((prev) => {
      const newVisibleColumns = {
        ...prev,
        [columnField]: !prev[columnField],
      };
      try {
        localStorage.setItem("visibleColumns", JSON.stringify(newVisibleColumns));
      } catch (error) {
        console.error("Failed to save visibleColumns to localStorage:", error);
      }
      return newVisibleColumns;
    });
  };

  const handleSort = (field) => {
    const direction =
      sortConfig.field === field && sortConfig.direction === "asc"
        ? "desc"
        : "asc";
    setSortConfig({ field, direction });
  };

  const sortedRows = useMemo(() => {
    if (!sortConfig.field) return rows;

    return [...rows].sort((a, b) => {
      const aValue = a[sortConfig.field] ?? "";
      const bValue = b[sortConfig.field] ?? "";

      // Handle numbers (including comma-separated strings)
      const numA =
        typeof aValue === "string"
          ? parseFloat(aValue.replace(/,/g, ""))
          : Number(aValue);
      const numB =
        typeof bValue === "string"
          ? parseFloat(bValue.replace(/,/g, ""))
          : Number(bValue);
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      // Handle dates
      if (Date.parse(aValue) && Date.parse(bValue)) {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle strings
      const stringA = String(aValue).toLowerCase();
      const stringB = String(bValue).toLowerCase();
      return sortConfig.direction === "asc"
        ? stringA.localeCompare(stringB)
        : stringB.localeCompare(stringA);
    });
  }, [rows, sortConfig]);

  const filteredColumns = useMemo(
    () => columns.filter((col) => visibleColumns[col.field] ?? true),
    [columns, visibleColumns]
  );

  const handleRestartColumns = () => {
    const resetState = columns.reduce(
      (acc, col) => ({ ...acc, [col.field]: true }),
      {}
    );
    setSortConfig({ field: null, direction: "asc" });
    setVisibleColumns(resetState);
    setStatusValue("");
    setStatusId(null);
    setShipperValue("");
    setShipperId(null);
    setTypeValue("");
    setTypeId(null);
    setStartDate(null);
    setEndDate(null);
    // Clear localStorage
    try {
      localStorage.removeItem("visibleColumns");
      localStorage.removeItem("tableFilters");
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
    handleClose();
  };

  return (
    <TableContainer
      component={Paper}
      sx={{ boxShadow: "none", padding: "20px 20px" }}
    >
      <div className="flex justify-between items-center mb-4">
        {totalQuantity > 0 && (
          <p className="text-xl font-medium">
            <span>Mahsulotlarning umumiy miqdori:</span> {totalQuantity}
          </p>
        )}
        <div className="flex w-full justify-end">
          <Tooltip title="Ustunlarni tahrirlash">
            <IconButton onClick={handleFilterClick}>
              <Filter size={18} />
            </IconButton>
          </Tooltip>
        </div>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            style: {
              maxHeight: 400,
              width: 300,
            },
          }}
        >
          <MenuItem disabled sx={{ fontWeight: "bold", mt: 1 }}>
            Ustunlarni tahrirlash:
          </MenuItem>
          {columns.map((column) => (
            <MenuItem
              key={`toggle-${column.field}`}
              onClick={() => toggleColumnVisibility(column.field)}
            >
              <Checkbox
                checked={visibleColumns[column.field] ?? true}
                size="small"
                sx={{ padding: "4px" }}
              />
              <span style={{ marginLeft: "8px" }}>{column.headerName}</span>
              {!visibleColumns[column.field] && (
                <EyeOff size={14} style={{ marginLeft: "auto" }} />
              )}
            </MenuItem>
          ))}
          <MenuItem
            onClick={handleRestartColumns}
            sx={{
              fontWeight: "bold",
              justifyContent: "center",
              mt: 1,
            }}
          >
            Filter ni tozalash
          </MenuItem>
        </Menu>
      </div>

      <Table sx={{ borderCollapse: "collapse" }}>
        <TableHead>
          <TableRow>
            {filteredColumns.map((column) => (
              <TableCell
                sx={{
                  color: "#7783c5",
                  border: "1px solid #f5efee",
                  padding: "5px 8px",
                  width: column?.width,
                }}
                key={column.field}
                onClick={() => column?.vector && handleSort(column.field)}
                className={
                  column?.vector ? "cursor-pointer hover:bg-gray-50" : ""
                }
              >
                <div className="flex items-center justify-between">
                  <span>{column.headerName}</span>
                  {column?.vector && (
                    <ChevronDown
                      size={18}
                      className={`transition-transform ${
                        sortConfig.field === column.field &&
                        sortConfig.direction === "desc"
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  )}
                </div>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedRows?.map((row, index) => (
            <TableRow key={index} hover>
              {filteredColumns.map((column) => (
                <TableCell
                  sx={{
                    border: "1px solid #f5efee",
                    padding: "5px 8px",
                  }}
                  key={`${column.field}-${index}`}
                >
                  {row[column.field] ?? "-"}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {total > 0 && (
        <div className="flex justify-end mt-4">
          <Pagination
            count={Math.ceil(total / rowsPerPage)}
            page={page + 1}
            onChange={(event, newPage) => onPageChange(event, newPage - 1)}
            color="primary"
            siblingCount={1}
            boundaryCount={1}
            sx={{
              button: {
                color: "black",
                "&.Mui-selected": {
                  backgroundColor: "#e2e2e2",
                  color: "black",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "gray",
                },
              },
              ul: {
                justifyContent: "center",
              },
            }}
          />
        </div>
      )}
    </TableContainer>
  );
}