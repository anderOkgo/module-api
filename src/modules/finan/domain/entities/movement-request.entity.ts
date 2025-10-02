export interface InitialLoadRequest {
  username?: string;
  currency?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
}

export interface MovementRequest {
  movement_name: string;
  movement_val: number;
  movement_date: string;
  movement_type: string;
  movement_tag: string;
  currency: string;
}

export interface MovementUpdateRequest extends Partial<MovementRequest> {
  id: number;
}
