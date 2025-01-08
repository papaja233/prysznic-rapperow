const clientId = '';
const clientSecret = '';

const artistGrid = document.getElementById('artist-grid');
const artistName = document.getElementById('artist-name');
const artistImage = document.getElementById('artist-image');
const albumsContainer = document.getElementById('albums');
const searchBar = document.getElementById('search-bar');

// Fetch an access token
async function getAccessToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch access token');
  }

  const data = await response.json();
  return data.access_token;
}


async function fetchTopArtists(accessToken) {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=genre:rap&type=artist&limit=50`, 
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  
  const sortedArtists = data.artists.items.sort((a, b) => b.popularity - a.popularity);
  return sortedArtists.slice(0, 6); 
}

async function fetchAlbums(accessToken, artistId) {
    const albums = [];
    let offset = 0;
    const limit = 50; 
  
    while (true) {
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/albums?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      if (!response.ok) {
        throw new Error('Failed to fetch albums');
      }
  
      const data = await response.json();
      
      // Filter albums to include only those where the artist is the primary artist and the album is not a single
      const ownAlbums = data.items.filter(album => {
        // Ensure the album is not a single, and the artist is the primary artist
        return album.album_type !== 'single' && album.artists.some(artist => artist.id === artistId) && album.artists[0].id === artistId;
      });
  
      albums.push(...ownAlbums); // Add the filtered albums to the list
  
      // If there are no more albums to fetch, break the loop
      if (data.items.length < limit) {
        break;
      }
  
      // Otherwise, increase the offset and fetch the next batch
      offset += limit;
    }
  
    return albums;
  }
  
  
  
  
  

async function showDetails(accessToken, artist) {
  artistName.textContent = artist.name;
  artistImage.innerHTML = `<img src="${artist.images[0]?.url}" alt="${artist.name}">`;

  const albums = await fetchAlbums(accessToken, artist.id);
  albumsContainer.innerHTML = '';
  albums.forEach(album => {
    const img = document.createElement('img');
    img.src = album.images[0]?.url || '';
    img.alt = album.name;
    albumsContainer.appendChild(img);
  });
}


async function populateArtists() {
  const accessToken = await getAccessToken();
  const artists = await fetchTopArtists(accessToken);

  artistGrid.innerHTML = '';
  artists.forEach(artist => {
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');
    gridItem.innerHTML = `<img src="${artist.images[0]?.url}" alt="${artist.name}">`;
    gridItem.onclick = () => showDetails(accessToken, artist);
    artistGrid.appendChild(gridItem);
  });
}


async function searchArtists(query) {
    const accessToken = await getAccessToken();
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=genre:rap%20${query}&type=artist&limit=9`, 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  
    if (!response.ok) {
      throw new Error('Failed to search artists');
    }
  
    const data = await response.json();
    const filteredArtists = data.artists.items.filter(artist => artist.followers.total > 2000000);
  
    artistGrid.innerHTML = ''; 
    filteredArtists.forEach(artist => {
      const gridItem = document.createElement('div');
      gridItem.classList.add('grid-item');
      gridItem.innerHTML = `<img src="${artist.images[0]?.url}" alt="${artist.name}">`;
      gridItem.onclick = () => showDetails(accessToken, artist);
      artistGrid.appendChild(gridItem);
    });
  }
  


searchBar.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (query) {
    searchArtists(query);
  } else {
    populateArtists(); 
  }
});


populateArtists();
