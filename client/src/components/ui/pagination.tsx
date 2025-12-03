import { Button } from "./button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onFirst?: () => void;
  onLast?: () => void;
  isLoading?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  limit,
  onPageChange,
  onNext,
  onPrev,
  onFirst,
  onLast,
  isLoading = false,
}: PaginationProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-4 px-2 gap-3 sm:gap-0">
      {/* Records Info */}
      <div className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
        <span className="font-medium">{t("dashboard.show")}:</span>{" "}
        <span className="font-medium">{limit}</span>{" "}
        {t("dashboard.records")}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2 overflow-x-auto max-w-full">
        {/* First Page Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onFirst}
          disabled={!hasPrev || isLoading}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:text-gray-400 disabled:hover:bg-transparent flex-shrink-0 px-2 sm:px-3"
          data-testid="button-first-page"
        >
          <ChevronsLeft className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">{t("dashboard.first")}</span>
        </Button>

        {/* Previous Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onPrev}
          disabled={!hasPrev || isLoading}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:text-gray-400 disabled:hover:bg-transparent flex items-center gap-1 flex-shrink-0 px-2 sm:px-3"
          data-testid="button-prev-page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{t("dashboard.previous")}</span>
        </Button>

        {/* Page Info */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 px-1 sm:px-2">
          <span className="hidden sm:inline">{t("dashboard.page")}</span>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {currentPage}
          </span>
          <span>/</span>
          <span className="font-medium">{totalPages}</span>
        </div>

        {/* Next Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={!hasNext || isLoading}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:text-gray-400 disabled:hover:bg-transparent flex items-center gap-1 flex-shrink-0 px-2 sm:px-3"
          data-testid="button-next-page"
        >
          <span className="hidden sm:inline">{t("dashboard.next")}</span>
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last Page Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onLast}
          disabled={!hasNext || isLoading}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:text-gray-400 disabled:hover:bg-transparent flex-shrink-0 px-2 sm:px-3"
          data-testid="button-last-page"
        >
          <span className="hidden sm:inline">{t("dashboard.last")}</span>
          <ChevronsRight className="w-4 h-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  );
}