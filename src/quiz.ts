export type Track = {
  id: string;
  name: string;
  url: string;
}

export const shuffleTracks = (tracks: Track[]) => {
  return tracks.sort(() => Math.random() - 0.5);
};


export const choiceOtherTracks = (
  answerTrack: Track,
  allTracks: Track[],
  count: number = 3,
) => {
  return shuffleTracks(allTracks.filter(t => t.id !== answerTrack.id)).slice(0, count);
}