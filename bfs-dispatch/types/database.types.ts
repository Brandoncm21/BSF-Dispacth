export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          address_id: number;
          street_id: number | null;
          address_description: string | null;
          state_id: number | null;
        };
        Insert: {
          address_id?: number;
          street_id?: number | null;
          address_description?: string | null;
          state_id?: number | null;
        };
        Update: {
          address_id?: number;
          street_id?: number | null;
          address_description?: string | null;
          state_id?: number | null;
        };
      };

      brokers: {
        Row: {
          broker_id: number;
          first_name: string;
          last_name: string;
          email: string | null;
          phone_number: string | null;
          status_id: number | null;
        };
        Insert: {
          broker_id?: number;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone_number?: string | null;
          status_id?: number | null;
        };
        Update: {
          broker_id?: number;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone_number?: string | null;
          status_id?: number | null;
        };
      };

      cargo_types: {
        Row: {
          cargo_type_id: number;
          cargo_type_name: string;
          status_id: number | null;
        };
        Insert: {
          cargo_type_id?: number;
          cargo_type_name: string;
          status_id?: number | null;
        };
        Update: {
          cargo_type_id?: number;
          cargo_type_name?: string;
          status_id?: number | null;
        };
      };

      carriers: {
        Row: {
          carrier_id: number;
          first_name: string;
          last_name: string;
          address: string | null;
          phone_number: string | null;
          email: string | null;
          motor_carrier_id: string | null;
          us_department_of_transportation_number: string | null;
          employer_identification_number: string | null;
          social_security_number: string | null;
          status_id: number | null;
          factoring: boolean | null;
          mc_number: string | null;
        };
        Insert: {
          carrier_id?: number;
          first_name: string;
          last_name: string;
          address?: string | null;
          phone_number?: string | null;
          email?: string | null;
          motor_carrier_id?: string | null;
          us_department_of_transportation_number?: string | null;
          employer_identification_number?: string | null;
          social_security_number?: string | null;
          status_id?: number | null;
          factoring?: boolean | null;
          mc_number?: string | null;
        };
        Update: {
          carrier_id?: number;
          first_name?: string;
          last_name?: string;
          address?: string | null;
          phone_number?: string | null;
          email?: string | null;
          motor_carrier_id?: string | null;
          us_department_of_transportation_number?: string | null;
          employer_identification_number?: string | null;
          social_security_number?: string | null;
          status_id?: number | null;
          factoring?: boolean | null;
          mc_number?: string | null;
        };
      };

      cities: {
        Row: {
          city_id: number;
          city_name: string;
          state_id: number | null;
        };
        Insert: {
          city_id?: number;
          city_name: string;
          state_id?: number | null;
        };
        Update: {
          city_id?: number;
          city_name?: string;
          state_id?: number | null;
        };
      };

      drivers: {
        Row: {
          driver_id: number;
          first_name: string;
          last_name: string;
          phone_number: string | null;
          license_type: string | null;
          carrier_id: number | null;
          status_id: number | null;
          cdl_number: string | null;
        };
        Insert: {
          driver_id?: number;
          first_name: string;
          last_name: string;
          phone_number?: string | null;
          license_type?: string | null;
          carrier_id?: number | null;
          status_id?: number | null;
          cdl_number?: string | null;
        };
        Update: {
          driver_id?: number;
          first_name?: string;
          last_name?: string;
          phone_number?: string | null;
          license_type?: string | null;
          carrier_id?: number | null;
          status_id?: number | null;
          cdl_number?: string | null;
        };
      };

      employees: {
        Row: {
          employee_id: number;
          first_name: string;
          last_name: string;
          role_id: number | null;
          status_id: number | null;
          auth_user_id: string | null;
          dispatch_vendor: string | null;
        };
        Insert: {
          employee_id?: number;
          first_name: string;
          last_name: string;
          role_id?: number | null;
          status_id?: number | null;
          auth_user_id?: string | null;
          dispatch_vendor?: string | null;
        };
        Update: {
          employee_id?: number;
          first_name?: string;
          last_name?: string;
          role_id?: number | null;
          status_id?: number | null;
          auth_user_id?: string | null;
          dispatch_vendor?: string | null;
        };
      };

      loads: {
        Row: {
          load_id: number;
          load_number: string | null;
          load_data: string | null;
          load_weight: number | null;
          rate: number | null;
          dispatch_fee: number | null;
          dispatch_fee_pct: number | null;
          factoring: boolean;
          load_status: 'pending' | 'booked' | 'picked_up' | 'delivered' | 'paid' | null;
          paid_status: 'unpaid' | 'partial' | 'paid' | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          booked_at: string | null;
          paid_at: string | null;
          carrier_id: number | null;
          truck_id: number | null;
          driver_id: number | null;
          route_id: number | null;
          origin_address_id: number | null;
          destination_address_id: number | null;
          dispatcher_id: number | null;
          status_id: number | null;
          cargo_type_id: number | null;
          special_requirements_id: number | null;
          created_at: string | null;
        };
        Insert: {
          load_id?: number;
          load_number?: string | null;
          load_data?: string | null;
          load_weight?: number | null;
          rate?: number | null;
          dispatch_fee?: number | null;
          dispatch_fee_pct?: number | null;
          factoring?: boolean;
          load_status?: 'pending' | 'booked' | 'picked_up' | 'delivered' | 'paid' | null;
          paid_status?: 'unpaid' | 'partial' | 'paid' | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          booked_at?: string | null;
          paid_at?: string | null;
          carrier_id?: number | null;
          truck_id?: number | null;
          driver_id?: number | null;
          route_id?: number | null;
          origin_address_id?: number | null;
          destination_address_id?: number | null;
          dispatcher_id?: number | null;
          status_id?: number | null;
          cargo_type_id?: number | null;
          special_requirements_id?: number | null;
          created_at?: string | null;
        };
        Update: {
          load_id?: number;
          load_number?: string | null;
          load_data?: string | null;
          load_weight?: number | null;
          rate?: number | null;
          dispatch_fee?: number | null;
          dispatch_fee_pct?: number | null;
          factoring?: boolean;
          load_status?: 'pending' | 'booked' | 'picked_up' | 'delivered' | 'paid' | null;
          paid_status?: 'unpaid' | 'partial' | 'paid' | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          booked_at?: string | null;
          paid_at?: string | null;
          carrier_id?: number | null;
          truck_id?: number | null;
          driver_id?: number | null;
          route_id?: number | null;
          origin_address_id?: number | null;
          destination_address_id?: number | null;
          dispatcher_id?: number | null;
          status_id?: number | null;
          cargo_type_id?: number | null;
          special_requirements_id?: number | null;
          created_at?: string | null;
        };
      };

      roles: {
        Row: {
          role_id: number;
          role_name: string;
          status_id: number | null;
          role_type: 'admin' | 'dispatcher' | 'logistics' | 'sales' | null;
        };
        Insert: {
          role_id?: number;
          role_name: string;
          status_id?: number | null;
          role_type?: 'admin' | 'dispatcher' | 'logistics' | 'sales' | null;
        };
        Update: {
          role_id?: number;
          role_name?: string;
          status_id?: number | null;
          role_type?: 'admin' | 'dispatcher' | 'logistics' | 'sales' | null;
        };
      };

      routes: {
        Row: {
          route_id: number;
          origin_address_id: number | null;
          destination_address_id: number | null;
          estimated_time: string | null;
          miles: number | null;
          status_id: number | null;
        };
        Insert: {
          route_id?: number;
          origin_address_id?: number | null;
          destination_address_id?: number | null;
          estimated_time?: string | null;
          miles?: number | null;
          status_id?: number | null;
        };
        Update: {
          route_id?: number;
          origin_address_id?: number | null;
          destination_address_id?: number | null;
          estimated_time?: string | null;
          miles?: number | null;
          status_id?: number | null;
        };
      };

      sales: {
        Row: {
          sales_id: number;
          total_amount: number | null;
          total_cost: number | null;
          profit_pct: number | null;
          total_profit: number | null;
          sale_date: string | null;
          broker_id: number | null;
          employee_id: number | null;
          status_id: number | null;
        };
        Insert: {
          sales_id?: number;
          total_amount?: number | null;
          total_cost?: number | null;
          profit_pct?: number | null;
          total_profit?: number | null;
          sale_date?: string | null;
          broker_id?: number | null;
          employee_id?: number | null;
          status_id?: number | null;
        };
        Update: {
          sales_id?: number;
          total_amount?: number | null;
          total_cost?: number | null;
          profit_pct?: number | null;
          total_profit?: number | null;
          sale_date?: string | null;
          broker_id?: number | null;
          employee_id?: number | null;
          status_id?: number | null;
        };
      };

      special_requirements: {
        Row: {
          special_requirements_id: number;
          requirement_description: string | null;
          status_id: number | null;
        };
        Insert: {
          special_requirements_id?: number;
          requirement_description?: string | null;
          status_id?: number | null;
        };
        Update: {
          special_requirements_id?: number;
          requirement_description?: string | null;
          status_id?: number | null;
        };
      };

      states: {
        Row: {
          state_id: number;
          state_name: string;
          status_id: number | null;
        };
        Insert: {
          state_id?: number;
          state_name: string;
          status_id?: number | null;
        };
        Update: {
          state_id?: number;
          state_name?: string;
          status_id?: number | null;
        };
      };

      streets: {
        Row: {
          street_id: number;
          street_name: string;
          city_id: number | null;
          state_id: number | null;
        };
        Insert: {
          street_id?: number;
          street_name: string;
          city_id?: number | null;
          state_id?: number | null;
        };
        Update: {
          street_id?: number;
          street_name?: string;
          city_id?: number | null;
          state_id?: number | null;
        };
      };

      trucks: {
        Row: {
          truck_id: number;
          unit_number: string;
          vehicle_type: string | null;
          capacity: string | null;
          operational_status: string | null;
          carrier_id: number | null;
          status_id: number | null;
        };
        Insert: {
          truck_id?: number;
          unit_number: string;
          vehicle_type?: string | null;
          capacity?: string | null;
          operational_status?: string | null;
          carrier_id?: number | null;
          status_id?: number | null;
        };
        Update: {
          truck_id?: number;
          unit_number?: string;
          vehicle_type?: string | null;
          capacity?: string | null;
          operational_status?: string | null;
          carrier_id?: number | null;
          status_id?: number | null;
        };
      };
    };

    Views: {
      v_sales_performance: {
        Row: {
          sales_id: number;
          sale_date: string | null;
          total_amount: number | null;
          total_cost: number | null;
          total_profit: number | null;
          profit_pct: number | null;
          broker_name: string;
          dispatcher_name: string;
          origin_state_name: string;
          destination_state_name: string;
          load_number: string | null;
          rate: number | null;
          dispatch_fee: number | null;
          status_id: number | null;
        };
      };

      trucks_with_availability: {
        Row: {
          truck_id: number;
          unit_number: string;
          vehicle_type: string | null;
          capacity: string | null;
          operational_status: string | null;
          carrier_id: number | null;
          carrier_name: string | null;
          record_status: string | null;
          availability_status: 'disponible' | 'en_ruta' | 'maintenance' | null;
          current_route: string | null;
          current_load_status: string | null;
          current_load_id: number | null;
          current_load_number: string | null;
          current_load_created_at: string | null;
        };
      };
    };

    Functions: {
      get_truck_load_history: {
        Args: {
          p_truck_id: number;
          p_days: number;
        };
        Returns: Array<{
          load_id: number;
          load_number: string;
          load_date: string;
          origin: string;
          destination: string;
          load_status: string;
          rate: number;
          dispatch_fee: number;
        }>;
      };

      get_trucks_with_smart_status: {
        Args: Record<string, never>;
        Returns: Array<{
          truck_id: number;
          unit_number: string;
          truck_type: string | null;
          carrier_id: number | null;
          carrier_name: string | null;
          operational_status: string | null;
          current_load_id: number | null;
          current_load_number: string | null;
          smart_status: 'active' | 'inactive' | 'maintenance' | 'in_route';
          status_reason: string | null;
        }>;
      };

      get_user_role_type: {
        Args: Record<string, never>;
        Returns: string;
      };

      search_employees: {
        Args: {
          p_search: string | null;
          p_role: string | null;
          p_status: string | null;
          p_limit: number;
          p_offset: number;
        };
        Returns: Array<{
          employee_id: number;
          first_name: string;
          last_name: string;
          role_name: string;
          role_type: string | null;
          status_name: string;
          status_id: number;
          total_count: number;
        }>;
      };

      search_loads: {
        Args: {
          p_search: string | null;
          p_status: string | null;
          p_limit: number;
          p_offset: number;
        };
        Returns: Array<{
          load_id: number;
          load_number: string | null;
          load_data: string | null;
          load_weight: number | null;
          rate: number | null;
          dispatch_fee: number | null;
          factoring: boolean;
          load_status: string | null;
          paid_status: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          carrier_id: number | null;
          truck_id: number | null;
          driver_id: number | null;
          route_id: number | null;
          cargo_type_id: number | null;
          dispatcher_id: number | null;
          status_id: number | null;
          carrier_name: string | null;
          driver_name: string | null;
          unit_number: string | null;
          miles: number | null;
          cargo_type_name: string | null;
          total_count: number;
        }>;
      };

      toggle_employee_status: {
        Args: {
          p_employee_id: number;
        };
        Returns: boolean;
      };

      update_employee_role: {
        Args: {
          p_employee_id: number;
          p_role_id: number;
        };
        Returns: boolean;
      };
    };
  };
};