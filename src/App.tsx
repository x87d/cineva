import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Search } from '@/pages/Search'
import { Browse } from '@/pages/Browse'
import { MovieDetails } from '@/pages/MovieDetails'
import { TasteTest } from '@/pages/TasteTest'
import { Recommendations } from '@/pages/Recommendations'
import { Feed } from '@/pages/Feed'
import { WildCard } from '@/pages/WildCard'
import { Library } from '@/pages/Library'
import { Profile } from '@/pages/Profile'
import { Settings } from '@/pages/Settings'
import { MyTaste } from '@/pages/MyTaste'
import { ImportLetterboxd } from '@/pages/ImportLetterboxd'
import { ResetPassword } from '@/pages/ResetPassword'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/taste" element={<TasteTest />} />
        <Route path="/my-taste" element={<MyTaste />} />
        <Route path="/import" element={<ImportLetterboxd />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/wildcard" element={<WildCard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
      </Routes>
    </Layout>
  )
}
