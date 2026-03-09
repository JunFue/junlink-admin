import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Classification,
  fetchClassifications,
  createClassification,
  updateClassification,
  deleteClassification,
  checkClassificationUsage,
  transferClassification,
} from "../lib/cashout.api";

export function useClassifications(storeId: string) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: classifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["classifications", storeId],
    queryFn: () => fetchClassifications(storeId),
  });

  const addClassification = async (name: string, icon: string = 'Store') => {
    setIsProcessing(true);
    try {
      await createClassification(storeId, name, icon);
      queryClient.invalidateQueries({ queryKey: ["classifications", storeId] });
    } finally {
      setIsProcessing(false);
    }
  };

  const editClassification = async (id: string, name: string, icon?: string) => {
    setIsProcessing(true);
    try {
      await updateClassification(id, name, icon);
      queryClient.invalidateQueries({ queryKey: ["classifications", storeId] });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeClassification = async (id: string) => {
    setIsProcessing(true);
    try {
      await deleteClassification(id);
      queryClient.invalidateQueries({ queryKey: ["classifications", storeId] });
    } finally {
      setIsProcessing(false);
    }
  };

  const checkUsage = async (id: string) => {
    return await checkClassificationUsage(id);
  };

  const transfer = async (fromId: string, toId: string) => {
    setIsProcessing(true);
    try {
      await transferClassification(fromId, toId);
      queryClient.invalidateQueries({ queryKey: ["classifications", storeId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", storeId] });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    classifications,
    isLoading,
    error: error ? (error as Error).message : null,
    addClassification,
    editClassification,
    removeClassification,
    checkUsage,
    transfer,
    isProcessing,
  };
}
