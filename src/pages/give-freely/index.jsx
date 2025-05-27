import { ArrowRightFromLine, Pencil } from "lucide-react";
import React, { useEffect, useState } from "react";
import GlobalTable from "../../components/global-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import $api from "../../http/api";
import NoData from "../../assets/no-data.png";
import { Box, CircularProgress, Typography } from "@mui/material";
import { getStatusStyle } from "../../utils/status";
import { format } from "date-fns";
import {
  useDateFilterStore,
  useMibStore,
  useStatusFilterStore,
  useSudStore,
} from "../../hooks/useFilterStore";

export default function GiveFreely() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page")) || 1; // API uchun 1-based
  const limitParam = parseInt(searchParams.get("limit")) || 100;

  const { setValue, setId } = useStatusFilterStore();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { id: mibId } = useMibStore();
  const { id: sudId } = useSudStore();
  const { startDate, endDate } = useDateFilterStore();

  // Pagination state will now sync with URL params
  const [pagination, setPagination] = useState({
    page: pageParam - 1, // MUI uchun 0-based
    rowsPerPage: limitParam,
    total: 0,
    currentPage: pageParam, // API uchun 1-based
  });

  const columns = [
    { field: "id", headerName: "№" },
    { field: "event_number", headerName: "Yuk xati raqami" },
    { field: "mib_number", headerName: "MIB ning dalolatnoma raqami" },
    { field: "mib_region", headerName: "MIB ning hududi" },
    { field: "sud_number", headerName: "Sudning ijro varaqa no'meri" },
    { field: "sud_region", headerName: "Sudning hududi" },
    { field: "sud_date", headerName: "Sudning sanasi" },
    { field: "total_price", headerName: "Umumiy narxi" },
    { field: "status", headerName: "Status" },
    { field: "actions", headerName: "Taxrirlash" },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await $api.get(
        "/statuses/products/by/3a926719-31d2-4a47-8117-b15ab503b5bc",
        {
          params: {
            page: pagination.currentPage,
            limit: pagination.rowsPerPage,
            search: searchQuery,
            mibId: mibId || "",
            sudId: sudId || "",
            startDate: startDate || "",
            endDate: endDate || "",
          },
        }
      );
      setData(res.data.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.data.data.pagination.totalItems || 0,
      }));
    } catch (error) {
      console.error("Ma'lumotlarni olishda xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync fetch when pagination or searchQuery changes
  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, pagination.rowsPerPage, searchQuery]);

  // Update URL params when pagination changes
  useEffect(() => {
    setSearchParams({
      search: searchQuery || "",
      page: pagination.currentPage,
      limit: pagination.rowsPerPage,
    });
  }, [
    pagination.currentPage,
    pagination.rowsPerPage,
    searchQuery,
    setSearchParams,
    sudId,
    mibId,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    setPagination({
      page: pageParam - 1,
      rowsPerPage: limitParam,
      total: pagination.total,
      currentPage: pageParam,
    });
  }, [pageParam, limitParam]);

  const handlePageChange = (event, newPage) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
      currentPage: newPage + 1,
    }));
  };

  const handleRowsPerPageChange = (value) => {
    const newRowsPerPage = parseInt(value);
    setPagination({
      page: 0,
      rowsPerPage: newRowsPerPage,
      currentPage: 1,
      total: pagination.total,
    });
  };

  const handleNext = (id) => {
    navigate(`/holatlar/${id}`);
    setValue("Begaraz berilgan");
    setId("3a926719-31d2-4a47-8117-b15ab503b5bc");
  };

  const rows = data.map((row, index) => ({
    id: index + 1 + pagination.page * pagination.rowsPerPage,
    name: row.name || "Noma’lum",
    event_number: "#" + `${row.event_product?.event_number}` || "Noma’lum",
    mib_region:
      row.document_product[row.document_product.length - 1]?.mib_document
        ?.name || "Yo'q",
    mib_number:
      row.document_product[row.document_product.length - 1]?.mib_dalolatnoma,
    sud_number:
      row.document_product[row.document_product.length - 1]?.sud_dalolatnoma ||
      "Yo'q",
    sud_region:
      row.document_product[row.document_product.length - 1]?.sud_document?.name,
    sud_date: format(
      row.document_product[row.document_product.length - 1]?.sud_date,
      "dd-MM-yyyy"
    ),
    total_price: row.total_price || "0",
    status: (
      <span
        className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${getStatusStyle(
          row.statusProduct?.product_status
        )}`}
      >
        {row.statusProduct?.product_status}
      </span>
    ),
    actions: (
      <div>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-400 cursor-pointer"
          onClick={() => handleNext(row.event_product.id)}
        >
          <ArrowRightFromLine size={16} />
        </button>
      </div>
    ),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xl text-[#249B73] uppercase font-semibold">
          Begaraz berilgan yuk xatlari ro'yxati
        </p>
      </div>

      {loading ? (
        <div className="text-center text-gray-500">
          <CircularProgress color="success" />
        </div>
      ) : data.length === 0 ? (
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
          rows={rows}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          total={pagination.total}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      )}
    </div>
  );
}
