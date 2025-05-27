import { ArrowRightFromLine, CirclePlus, Pencil, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import GlobalTable from "../../components/global-table";
import {
  NavLink,
  Outlet,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useProductStore } from "../../hooks/useModalState";
import { usePathStore } from "../../hooks/usePathStore";
import $api from "../../http/api";
import { Box, CircularProgress, Typography } from "@mui/material";
import NoData from "../../assets/no-data.png";
import ProductModal from "../../modals/product-modal";
import { getStatusStyle } from "../../utils/status";
import StatusSelector from "../../components/status-selector";
import ConfirmationModal from "../../components/Add-product/IsAddProduct";
import ProductTypeSelector from "../../components/product-type";
import { useStatusFilterStore } from "../../hooks/useFilterStore";

export default function Products() {
  const { onOpen, data, setData, total, setTotal, setEditData } = useProductStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useStatusFilterStore();
  const { setName } = usePathStore();
  const navigate = useNavigate();
  const location = useLocation(); // Added useLocation
  const searchQuery = searchParams.get("search") || "";

  // Initialize page and rowsPerPage from URL
  const [page, setPage] = useState(() => {
    const pageParam = parseInt(searchParams.get("page"));
    return isNaN(pageParam) || pageParam < 1 ? 0 : pageParam - 1; // 0-based indexing
  });
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const limitParam = parseInt(searchParams.get("limit"));
    return isNaN(limitParam) || limitParam < 1 ? 25 : limitParam; // Changed default to 25
  });

  const [confirm, setConfirm] = useState({
    open: false,
    id: null,
    name: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state

  // Fetch products based on URL params and filters
  useEffect(() => {
    const getAllProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await $api.get(
          searchQuery ? `/products/search` : `/products/all`,
          {
            params: {
              page: page + 1, // API expects 1-based indexing
              limit: rowsPerPage,
              statusId: id || "",
              search: searchQuery,
            },
          }
        );
        setData(res.data.data || []);
        setTotal(res.data.total || 0);
      } catch (error) {
        console.error("Error fetching products:", error);
        setError("Failed to fetch products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    getAllProducts();
  }, [page, rowsPerPage, searchQuery, id, setData, setTotal]);

  // Reset page to 0 when searchQuery changes and no valid page param exists
  useEffect(() => {
    if (searchQuery) {
      const pageParam = parseInt(searchParams.get("page"));
      if (!pageParam || pageParam < 1) {
        setPage(0);
      }
    }
  }, [searchQuery, searchParams]);

  // Update URL params when page or rowsPerPage changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (page + 1).toString()); // 1-based indexing for URL
    newParams.set("limit", rowsPerPage.toString());
    setSearchParams(newParams, { replace: true });
  }, [page, rowsPerPage, setSearchParams]);

  const columns = [
    { field: "id", headerName: "№" },
    { field: "event", headerName: "Holat raqami", width: 100 },
    { field: "name", headerName: "Nomi" },
    { field: "quantity", headerName: "Soni", vector: true },
    { field: "price", headerName: "Narxi", vector: true },
    { field: "total_price", headerName: "Umumiy narx", vector: true },
    {
      field: "status",
      headerName: <StatusSelector />,
      width: 100,
    },
    {
      field: "type",
      headerName: <ProductTypeSelector />,
    },
    { field: "actions", headerName: "Amallar" },
  ];

  const handleDelete = async () => {
    if (confirm.open && confirm.id) {
      try {
        const res = await $api.delete(`products/delete/${confirm.id}`);
        if (res.status === 200) {
          setData(data.filter((item) => item.id !== confirm.id));
          setConfirm((prev) => ({ ...prev, open: false }));
        }
      } catch (error) {
        console.error("Delete error:", error);
        setError("Failed to delete product. Please try again.");
      }
    }
  };

  const editData = (row) => {
    setEditData(row);
    onOpen();
  };

  const formattedRows = data.map((row, i) => ({
    ...row,
    id: rowsPerPage * page + i + 1, // Use API-provided ID
    quantity: Number(row.quantity).toFixed(0),
    price: Number(row.price).toLocaleString("en-US", {
      minimumFractionDigits: row.price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }),
    total_price: Number(row.total_price).toLocaleString("en-US", {
      minimumFractionDigits: row.total_price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }),
    status: (
      <span
        className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${getStatusStyle(
          row.statusProduct?.product_status || "Saqlovda"
        )}`}
      >
        {row.statusProduct?.product_status}
      </span>
    ),
    event: "#" + row.event_product?.event_number || "Noma'lum",
    type: row.type_product?.product_type || "Noma'lum",
    actions: (
      <div className="flex items-center gap-2">
        <button
          onClick={() => editData(row)}
          className="border border-gray-500 rounded-full p-1 cursor-pointer"
        >
          <Pencil size={17} />
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 cursor-pointer"
          onClick={() =>
            setConfirm((prev) => ({
              ...prev,
              open: true,
              id: row.id,
              name: row.name,
            }))
          }
        >
          <Trash size={16} />
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 cursor-pointer"
          onClick={() => nextButton(row)}
        >
          <ArrowRightFromLine size={16} />
        </button>
      </div>
    ),
  }));

  const nextButton = (row) => {
    setName(row.name);
    navigate(`/maxsulotlar/${row.id}`);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xl text-[#249B73] uppercase font-semibold">
          Mahsulotlar ro'yxati
        </p>
        <button
          onClick={onOpen}
          className="text-base text-white flex items-center gap-2 bg-[#249B73] px-4 py-2 rounded-md cursor-pointer"
        >
          <CirclePlus />
          <span>Yangi qo'shish</span>
        </button>
      </div>

      {/* NAVBAR */}
      <div className="flex gap-4 mb-6">
        <NavLink
          to="/maxsulotlar"
          end
          className={({ isActive }) =>
            `px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
              isActive
                ? "bg-[#249B73] text-white shadow"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`
          }
        >
          Maxsulotlar
        </NavLink>
        <NavLink
          to="/maxsulotlar/panding"
          className={({ isActive }) =>
            `px-4 py-2 rounded-md text-sm font-medium transition duration-200 ${
              isActive
                ? "bg-[#249B73] text-white shadow"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`
          }
        >
          Hali tasdiqlanmagan mahsulotlar
        </NavLink>
      </div>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

７      {location.pathname === "/maxsulotlar" ? (
        loading ? (
          <div className="flex justify-center mt-10">
            <CircularProgress color="success" />
          </div>
        ) : total === 0 ? (
          <Box textAlign="center" py={10} sx={{ userSelect: "none" }}>
            <Box
              component="img"
              src={NoData}
              alt="No data"
              sx={{ width: 128, height: 128, margin: "0 auto", mb: 2 }}
            />
            <Typography variant="body1" color="text.secondary">
              Hech qanday ma'lumot topilmadi
            </Typography>
          </Box>
        ) : (
          <GlobalTable
            columns={columns}
            rows={formattedRows}
            page={page}
            rowsPerPage={rowsPerPage}
            total={total}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )
      ) : (
        <Outlet />
      )}

      <ProductModal />
      <ConfirmationModal
        isOpen={confirm.open}
        onClose={() => setConfirm((prev) => ({ ...prev, open: false }))}
        message={
          confirm.id ? (
            <span>
              Siz{" "}
              <span className="text-red-500 font-semibold">{confirm.name}</span>{" "}
              ni o'chirmoqchimisiz?
            </span>
          ) : (
            "Yangi mahsulot qo'shmoq?"
          )
        }
        onConfirm={confirm.id ? handleDelete : onOpen}
      />
    </div>
  );
}