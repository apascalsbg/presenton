'use client'
import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGroupLayoutLoader } from '../hooks/useGroupLayoutLoader'
import LoadingStates from '../components/LoadingStates'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const GroupLayoutPreview = () => {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    const { layoutGroup, loading, error, retry } = useGroupLayoutLoader(slug)

    // Handle loading state
    if (loading) {
        return <LoadingStates type="loading" />
    }

    // Handle error state
    if (error) {
        return <LoadingStates type="error" message={error} onRetry={retry} />
    }

    // Handle empty state
    if (!layoutGroup || layoutGroup.layouts.length === 0) {
        return <LoadingStates type="empty" onRetry={retry} />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Navigation */}
                    <div className="flex items-center gap-4 mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/layout-preview')}
                            className="flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            All Groups
                        </Button>
                    </div>

                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 capitalize">
                            {layoutGroup.groupName} Layouts
                        </h1>
                        <p className="text-gray-600 mt-2">
                            {layoutGroup.layouts.length} layout{layoutGroup.layouts.length !== 1 ? 's' : ''} • {layoutGroup.settings.description}
                        </p>

                    </div>
                </div>
            </header>

            {/* Layout Grid */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-8">
                    {layoutGroup.layouts.map((layout: any, index: number) => {
                        const { component: LayoutComponent, sampleData, name, fileName } = layout

                        return (
                            <Card
                                key={`${layoutGroup.groupName}-${index}`}
                                className="overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                            >
                                {/* Layout Header */}
                                <div className="bg-white px-6 py-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-sm text-gray-500 font-mono">{fileName}</span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {layoutGroup.groupName}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                                Layout #{index + 1}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Layout Content */}
                                <div className="bg-gray-50 aspect-video max-w-[1280px] w-full">
                                    <LayoutComponent data={sampleData} />
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-16">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="text-center text-gray-600">
                        <p>{layoutGroup.groupName} • {layoutGroup.layouts.length} components</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default GroupLayoutPreview
