
export interface LayoutInfo {
    name: string
    component: React.ComponentType<any>
    schema: any
    sampleData: any
    fileName: string
    groupName: string
    layoutId: string
}

export interface GroupSetting {
    description: string;
    ordered: boolean;
    default?: boolean;
}

export interface LayoutGroup {
    groupName: string
    layouts: LayoutInfo[]
    settings: GroupSetting
}

export interface GroupedLayoutsResponse {
    groupName: string
    files: string[]
    settings: GroupSetting | null
}

export interface LoadingState {
    loading: boolean
    error: string | null
}

export interface NavigationState {
    currentLayout: number
    totalLayouts: number
}

export type LoadingStateType = 'loading' | 'error' | 'empty'

export interface ComponentProps {
    className?: string
    children?: React.ReactNode
} 