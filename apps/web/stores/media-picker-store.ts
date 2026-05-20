import { create } from "zustand"

interface MediaPickerState {
  search: string
  filterTags: string[]
  page: number
  setSearch: (search: string) => void
  setFilterTags: (tags: string[]) => void
  setPage: (page: number) => void
}

export const useMediaPickerStore = create<MediaPickerState>((set) => ({
  search: "",
  filterTags: [],
  page: 1,
  setSearch: (search) => set({ search }),
  setFilterTags: (filterTags) => set({ filterTags }),
  setPage: (page) => set({ page }),
}))
