export type LayoutMode = 'teacher' | 'pip';

export interface MediaItem {
  id: string;
  src: string;
  name: string;
  type: 'photo' | 'upload' | 'screenshot';
}

export interface Participant {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  avatar?: string;
  online: boolean;
  handRaised?: { message: string };
}
