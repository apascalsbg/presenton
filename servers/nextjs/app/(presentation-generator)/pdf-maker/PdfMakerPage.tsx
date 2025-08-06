"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Skeleton } from "@/components/ui/skeleton";


import { DashboardApi } from "@/app/dashboard/api/dashboard";


import { toast } from "sonner";



import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useGroupLayouts } from "../hooks/useGroupLayouts";
import { setPresentationData } from "@/store/slices/presentationGeneration";



const PresentationPage = ({ presentation_id }: { presentation_id: string }) => {
    const { renderSlideContent, loading } = useGroupLayouts();
    const [contentLoading, setContentLoading] = useState(true);
    const dispatch = useDispatch();
    const { presentationData } = useSelector(
        (state: RootState) => state.presentationGeneration
    );
    const [error, setError] = useState(false);
    // Function to fetch the slides
    useEffect(() => {
        fetchUserSlides();
    }, []);

    // Function to fetch the user slides
    const fetchUserSlides = async () => {
        try {
            const data = await DashboardApi.getPresentation(presentation_id);
            dispatch(setPresentationData(data));
            setContentLoading(false);
        } catch (error) {
            setError(true);
            toast.error("Failed to load presentation");
            console.error("Error fetching user slides:", error);
            setContentLoading(false);
        }
    };
    // Regular view
    return (
        <div className="flex overflow-hidden flex-col">
            {error ? (
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                    <div
                        className="bg-white border border-red-300 text-red-700 px-6 py-8 rounded-lg shadow-lg flex flex-col items-center"
                        role="alert"
                    >
                        <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
                        <strong className="font-bold text-4xl mb-2">Oops!</strong>
                        <p className="block text-2xl py-2">
                            We encountered an issue loading your presentation.
                        </p>
                        <p className="text-lg py-2">
                            Please check your internet connection or try again later.
                        </p>
                        <Button
                            className="mt-4 bg-red-500 text-white hover:bg-red-600 focus:ring-4 focus:ring-red-300"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </Button>
                    </div>
                </div>
            ) : (


                <div className="">
                    <div
                        id="presentation-slides-wrapper"
                        className="mx-auto flex flex-col items-center  overflow-hidden  justify-center   "

                    >
                        {!presentationData ||
                            loading ||
                            contentLoading ||
                            !presentationData?.slides ||
                            presentationData?.slides.length === 0 ? (
                            <div className="relative w-full h-[calc(100vh-120px)] mx-auto ">
                                <div className=" ">
                                    {Array.from({ length: 2 }).map((_, index) => (
                                        <Skeleton
                                            key={index}
                                            className="aspect-video bg-gray-400 my-4 w-full mx-auto max-w-[1280px]"
                                        />
                                    ))}
                                </div>

                            </div>
                        ) : (
                            <>
                                {presentationData &&
                                    presentationData.slides &&
                                    presentationData.slides.length > 0 &&
                                    presentationData.slides.map((slide: any, index: number) => (
                                        <div key={index} className="w-full">
                                            {renderSlideContent(slide, false)}
                                        </div>
                                    ))}
                            </>
                        )}
                    </div>
                </div>

            )}
        </div>
    );
};

export default PresentationPage;
