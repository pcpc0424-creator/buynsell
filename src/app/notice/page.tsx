import Link from 'next/link';
import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';

// Mock data - will be replaced with actual data from API
const notices = [
  {
    id: 1,
    title: 'New Property Listing Guidelines',
    content: 'We have updated our property listing guidelines to ensure better quality listings. All agents are required to follow the new guidelines starting from January 2024.',
    date: '2024-01-15',
    category: 'Policy Update',
  },
  {
    id: 2,
    title: 'System Maintenance Notice',
    content: 'Our platform will undergo scheduled maintenance on January 20, 2024, from 2:00 AM to 6:00 AM (PHT). During this time, some features may be temporarily unavailable.',
    date: '2024-01-12',
    category: 'System',
  },
  {
    id: 3,
    title: 'New Premium Features Launched',
    content: 'We are excited to announce new premium features for our Gold and Premium tier members, including priority listing visibility and advanced analytics.',
    date: '2024-01-10',
    category: 'Announcement',
  },
  {
    id: 4,
    title: 'Holiday Schedule 2024',
    content: 'Please note our customer support team will have limited availability during the following Philippine holidays. For urgent matters, please use our online support system.',
    date: '2024-01-05',
    category: 'General',
  },
  {
    id: 5,
    title: 'Photo Upload Quality Standards',
    content: 'To improve the user experience, we now require all property photos to meet minimum resolution standards of 1280x720 pixels. Photos below this quality will not be accepted.',
    date: '2024-01-02',
    category: 'Policy Update',
  },
];

const categoryColors: Record<string, string> = {
  'Policy Update': 'bg-accent-purple',
  'System': 'bg-accent-cyan',
  'Announcement': 'bg-accent-pink',
  'General': 'bg-accent-blue',
};

export default function NoticePage() {
  return (
    <>
      <Header />
      <PropertyCategories />

      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              <span className="gradient-text">Notice</span> Board
            </h1>
            <p className="text-slate-500">Stay updated with the latest announcements and updates</p>
          </div>

          {/* Notices List */}
          <div className="space-y-6">
            {notices.map((notice) => (
              <article key={notice.id} className="glass-ultra rounded-2xl p-6 hover:bg-white/[0.04] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${categoryColors[notice.category] || 'bg-slate-200'}`}>
                    {notice.category}
                  </span>
                  <time className="text-slate-400 text-sm">
                    {new Date(notice.date).toLocaleDateString('en-PH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <h2 className="text-xl font-semibold text-white mb-3">{notice.title}</h2>
                <p className="text-slate-500 text-sm leading-relaxed">{notice.content}</p>
                <Link
                  href={`/notice/${notice.id}`}
                  className="inline-flex items-center text-accent-blue text-sm mt-4 hover:text-accent-purple transition-colors"
                >
                  Read more
                  <i className="fas fa-arrow-right ml-2 text-xs"></i>
                </Link>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-12">
            <button className="w-10 h-10 rounded-xl glass-ultra flex items-center justify-center text-slate-500 hover:text-white transition-all">
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="w-10 h-10 rounded-xl btn-premium text-white font-semibold">1</button>
            <button className="w-10 h-10 rounded-xl glass-ultra text-slate-500 hover:text-white transition-all">2</button>
            <button className="w-10 h-10 rounded-xl glass-ultra flex items-center justify-center text-slate-500 hover:text-white transition-all">
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>

      <Services />
      <Footer />
    </>
  );
}
