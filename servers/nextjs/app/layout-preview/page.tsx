'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useLayoutLoader } from './hooks/useLayoutLoader'
import LoadingStates from './components/LoadingStates'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const LayoutPreview = () => {
    const { layoutGroups, layouts, loading, error, retry } = useLayoutLoader()
    const router = useRouter()

    // Handle loading state
    if (loading) {
        return <LoadingStates type="loading" />
    }

    // Handle error state
    if (error) {
        return <LoadingStates type="error" message={error} onRetry={retry} />
    }

    // Handle empty state
    if (layoutGroups.length === 0 || layouts.length === 0) {
        return <LoadingStates type="empty" onRetry={retry} />
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Layout Preview</h1>
                        <p className="text-gray-600 mt-2">
                            {layoutGroups.length} groups • {layouts.length} layouts
                        </p>

                    </div>
                </div>

                {/* Group Navigation Cards */}
                <div className="border-t bg-gray-50 min-h-screen flex justify-center items-center">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {layoutGroups.map((group) => (
                                <Card
                                    key={group.groupName}
                                    className="cursor-pointer hover:shadow-md transition-all duration-200 group"
                                    onClick={() => router.push(`/layout-preview/${group.groupName}`)}
                                >
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900 capitalize group-hover:text-blue-600 transition-colors">
                                                {group.groupName}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                    {group.layouts.length}
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4">
                                            {group.settings.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">
                                                {group.layouts.length} layout{group.layouts.length !== 1 ? 's' : ''}
                                            </span>
                                            {group.settings.default && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            </div>



        </div>
    )
}

export default LayoutPreview
