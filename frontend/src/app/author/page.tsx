export default function AuthorDashboard() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-purple-400">Author Dashboard</h1>
            <p className="text-gray-400">Manage your novels, chapters, and earnings.</p>
          </div>
          <button className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-bold transition-colors shadow-lg">
            + New Novel
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="text-gray-400 font-medium mb-1">Total Reads</h3>
            <p className="text-4xl font-bold text-white">124.5K</p>
            <span className="text-green-500 text-sm mt-2 inline-block">↑ 12% this week</span>
          </div>
          <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="text-gray-400 font-medium mb-1">Total Revenue</h3>
            <p className="text-4xl font-bold text-green-400">$3,420.50</p>
            <span className="text-green-500 text-sm mt-2 inline-block">↑ 8% this week</span>
          </div>
          <div className="bg-gray-900 border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="text-gray-400 font-medium mb-1">Active Followers</h3>
            <p className="text-4xl font-bold text-white">8,920</p>
            <span className="text-purple-500 text-sm mt-2 inline-block">+142 today</span>
          </div>
        </div>

        {/* Novels List */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Your Novels</h2>
          <div className="bg-gray-900 border border-white/5 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-400">Novel</th>
                  <th className="px-6 py-4 font-medium text-gray-400">Chapters</th>
                  <th className="px-6 py-4 font-medium text-gray-400">Status</th>
                  <th className="px-6 py-4 font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[1, 2].map((i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-16 bg-gray-800 rounded"></div>
                      <div>
                        <p className="font-bold">The Shadow Monarch (Vol {i})</p>
                        <p className="text-sm text-gray-400">Fantasy</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">142</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-medium">Published</span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-purple-400 hover:text-purple-300 font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
