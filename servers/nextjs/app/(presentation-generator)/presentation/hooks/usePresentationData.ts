import { useCallback, useEffect } from 'react';
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { DashboardApi } from "@/app/dashboard/api/dashboard";
import { setPresentationData } from "@/store/slices/presentationGeneration";

export const usePresentationData = (
  presentationId: string,
  setLoading: (loading: boolean) => void,
  setError: (error: boolean) => void
) => {
  const dispatch = useDispatch();

  const fetchUserSlides = useCallback(async () => {
    try {
      const data = await DashboardApi.getPresentation(presentationId);
      if (data) {
        dispatch(setPresentationData(data));
        setLoading(false);
      }
    } catch (error) {
      setError(true);
      toast.error("Failed to load presentation");
      console.error("Error fetching user slides:", error);
      setLoading(false);
    }
  }, [presentationId, dispatch, setLoading, setError]);

  useEffect(() => {
    fetchUserSlides();
  }, [fetchUserSlides]);

  return {
    fetchUserSlides,
  };
}; 