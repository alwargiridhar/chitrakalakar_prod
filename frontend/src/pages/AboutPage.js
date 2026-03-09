import React from 'react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">About ChitraKalakar</h1>
          <p className="text-xl text-gray-600">Connecting artists and art lovers through sustainable, artist-centric platforms</p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              ChitraKalakar is a community platform dedicated to preserving artistic voices, empowering creators, 
              and connecting traditional and contemporary art with modern audiences. We believe in creating sustainable, 
              artist-centric ecosystems where creativity flourishes.
            </p>
          </div>
        </div>

        {/* Founder Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Left - Image */}
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2Fd544415353454d4eb21bb43def9073da%2Fee0e8ae4a3fe4c82ad16df36dcbbb4fd?format=webp&width=800"
                  alt="Giridhar Alwar"
                  className="w-full h-auto rounded-lg shadow-lg object-cover"
                />
              </div>
            </div>

            {/* Right - Content */}
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Giridhar Alwar</h2>
              <p className="text-lg font-semibold text-orange-500 mb-6">Founder & Chief Chitrakalakar</p>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Giridhar Alwar is an Indian visual artist, author, and cultural entrepreneur, and the founder of ChitraKalakar. 
                  His creative journey began with writing and visual storytelling, where he explored themes of culture, identity, 
                  and everyday Indian life.
                </p>
                <p>
                  As an author and artist, Giridhar's work reflects a deep engagement with Indian aesthetics and narrative traditions, 
                  evolving from personal creative practice into building platforms that support other artists. His early initiatives 
                  under RamRath Artworks laid the foundation for a broader vision—creating sustainable, artist-centric ecosystems.
                </p>
                <p>
                  Through ChitraKalakar, he brings together his experience as an author, visual artist, and entrepreneur to preserve 
                  artistic voices, empower creators, and connect traditional and contemporary art with modern audiences.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Artist Empowerment</h3>
            <p className="text-gray-600 text-sm">
              We create sustainable platforms where artists can thrive, maintain creative control, and build meaningful relationships with their audience.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Cultural Preservation</h3>
            <p className="text-gray-600 text-sm">
              We celebrate and preserve traditional art forms while connecting them with contemporary audiences, bridging past and present.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8 text-center">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💫</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Community Connection</h3>
            <p className="text-gray-600 text-sm">
              We foster meaningful connections between artists and art lovers, creating a vibrant community that celebrates creativity.
            </p>
          </div>
        </div>

        {/* Why ChitraKalakar Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why ChitraKalakar?</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-500 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Direct Artist-Buyer Connection</h3>
                  <p className="text-gray-600">
                    Eliminate intermediaries and enable direct relationships between artists and patrons, ensuring fair compensation and artistic freedom.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-500 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Sustainable Ecosystem</h3>
                  <p className="text-gray-600">
                    Support artists with transparent pricing, manageable commissions, and opportunities to build lasting careers in the arts.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-500 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Curated Virtual Exhibitions</h3>
                  <p className="text-gray-600">
                    Showcase artworks through elegant virtual exhibitions, giving artists global reach and collectors access to diverse, authentic works.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-orange-500 font-bold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Artist-Centric Platform</h3>
                  <p className="text-gray-600">
                    Every feature is designed with artists' needs in mind—from portfolio management to exhibition creation and earnings tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
