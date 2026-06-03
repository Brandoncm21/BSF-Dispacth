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
          mc_number: string | null;
          usdot_number: string | null;
          status_id: number | null;
        };
        Insert: {
          broker_id?: number;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone_number?: string | null;
          mc_number?: string | null;
          usdot_number?: string | null;
          status_id?: number | null;
        };
        Update: {
          broker_id?: number;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone_number?: string | null;
          mc_number?: string | null;
          usdot_number?: string | null;
          status_id?: number | null;
        };
      };

      broker_contacts: {
        Row: {
          contact_id: number;
          broker_id: number;
          contact_name: string;
          email: string | null;
          phone: string | null;
          is_primary: boolean;
          status_id: number | null;
          created_at: string | null;
        };
        Insert: {
          contact_id?: number;
          broker_id: number;
          contact_name: string;
          email?: string | null;
          phone?: string | null;
          is_primary?: boolean;
          status_id?: number | null;
          created_at?: string | null;
        };
        Update: {
          contact_id?: number;
          broker_id?: number;
          contact_name?: string;
          email?: string | null;
          phone?: string | null;
          is_primary?: boolean;
          status_id?: number | null;
          created_at?: string | null;
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
          company_name: string;
          owner_name: string | null;
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
          dot_number: string | null;
          dispatch_fee_percent: number;
        };
        Insert: {
          carrier_id?: number;
          company_name: string;
          owner_name?: string | null;
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
          dot_number?: string | null;
          dispatch_fee_percent?: number;
        };
        Update: {
          carrier_id?: number;
          company_name?: string;
          owner_name?: string | null;
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
          dot_number?: string | null;
          dispatch_fee_percent?: number;
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
          has_twic_card: boolean;
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
          has_twic_card?: boolean;
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
          has_twic_card?: boolean;
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
          email: string | null;
        };
        Insert: {
          employee_id?: number;
          first_name: string;
          last_name: string;
          role_id?: number | null;
          status_id?: number | null;
          auth_user_id?: string | null;
          dispatch_vendor?: string | null;
          email?: string | null;
        };
        Update: {
          employee_id?: number;
          first_name?: string;
          last_name?: string;
          role_id?: number | null;
          status_id?: number | null;
          auth_user_id?: string | null;
          dispatch_vendor?: string | null;
          email?: string | null;
        };
      };

      loads: {
        Row: {
          load_id: number;
          load_number: string | null;
          load_data: string | null;
          weight_lbs: number | null;
          rate: number | null;
          dispatch_fee_pct: number | null;
          factoring: boolean;
          load_status: 'pending' | 'booked' | 'picked_up' | 'delivered' | 'paid' | 'cancelled' | 'delayed' | null;
          paid_status: 'unpaid' | 'partial' | 'paid' | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          booked_at: string | null;
          paid_at: string | null;
          carrier_id: number | null;
          truck_id: number | null;
          driver_id: number | null;
          route_id: number | null;
          dispatcher_id: number | null;
          status_id: number | null;
          cargo_type_id: number | null;
          special_requirements_id: number | null;
          created_at: string | null;
          broker_id: number | null;
        };
        Insert: {
          load_id?: number;
          load_number?: string | null;
          load_data?: string | null;
          weight_lbs?: number | null;
          rate?: number | null;
          dispatch_fee_pct?: number | null;
          factoring?: boolean;
          load_status?: 'pending' | 'booked' | 'picked_up' | 'delivered' | 'paid' | 'cancelled' | 'delayed' | null;
          paid_status?: 'unpaid' | 'partial' | 'paid' | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          booked_at?: string | null;
          paid_at?: string | null;
          carrier_id?: number | null;
          truck_id?: number | null;
          driver_id?: number | null;
          route_id?: number | null;
          dispatcher_id?: number | null;
          status_id?: number | null;
          cargo_type_id?: number | null;
          special_requirements_id?: number | null;
          created_at?: string | null;
          broker_id?: number | null;
        };
        Update: {
          load_id?: number;
          load_number?: string | null;
          load_data?: string | null;
          weight_lbs?: number | null;
          rate?: number | null;
          dispatch_fee_pct?: number | null;
          factoring?: boolean;
          load_status?: 'pending' | 'booked' | 'picked_up' | 'delivered' | 'paid' | 'cancelled' | 'delayed' | null;
          paid_status?: 'unpaid' | 'partial' | 'paid' | null;
          picked_up_at?: string | null;
          delivered_at?: string | null;
          booked_at?: string | null;
          paid_at?: string | null;
          carrier_id?: number | null;
          truck_id?: number | null;
          driver_id?: number | null;
          route_id?: number | null;
          dispatcher_id?: number | null;
          status_id?: number | null;
          cargo_type_id?: number | null;
          special_requirements_id?: number | null;
          created_at?: string | null;
        };
      };

      locations: {
        Row: {
          location_id: number;
          formatted_address: string;
          street: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          lat: number | null;
          lng: number | null;
          mapbox_place_id: string | null;
          source: string | null;
          status_id: number | null;
          created_at: string | null;
        };
        Insert: {
          location_id?: number;
          formatted_address: string;
          street?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          lat?: number | null;
          lng?: number | null;
          mapbox_place_id?: string | null;
          source?: string | null;
          status_id?: number | null;
          created_at?: string | null;
        };
        Update: {
          location_id?: number;
          formatted_address?: string;
          street?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          lat?: number | null;
          lng?: number | null;
          mapbox_place_id?: string | null;
          source?: string | null;
          status_id?: number | null;
          created_at?: string | null;
        };
      };

      driver_checkpoints: {
        Row: {
          checkpoint_id: number;
          load_id: number;
          driver_id: number | null;
          lat: number;
          lng: number;
          recorded_at: string;
          status_at_checkpoint: string | null;
          notes: string | null;
          created_by: number | null;
        };
        Insert: {
          checkpoint_id?: number;
          load_id: number;
          driver_id?: number | null;
          lat: number;
          lng: number;
          recorded_at?: string;
          status_at_checkpoint?: string | null;
          notes?: string | null;
          created_by?: number | null;
        };
        Update: {
          checkpoint_id?: number;
          load_id?: number;
          driver_id?: number | null;
          lat?: number;
          lng?: number;
          recorded_at?: string;
          status_at_checkpoint?: string | null;
          notes?: string | null;
          created_by?: number | null;
        };
      };

      earnings: {
        Row: {
          earnings_id: number;
          employee_id: number;
          load_id: number;
          sales_id: number | null;
          sale_date: string;
          earnings_amount: number;
          profit_type: string | null;
          earnings_status: string | null;
          created_at: string | null;
          updated_at: string | null;
          created_by: number | null;
          status_id: number | null;
        };
        Insert: {
          earnings_id?: number;
          employee_id: number;
          load_id: number;
          sales_id?: number | null;
          sale_date: string;
          earnings_amount: number;
          profit_type?: string | null;
          earnings_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: number | null;
          status_id?: number | null;
        };
        Update: {
          earnings_id?: number;
          employee_id?: number;
          load_id?: number;
          sales_id?: number | null;
          sale_date?: string;
          earnings_amount?: number;
          profit_type?: string | null;
          earnings_status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          created_by?: number | null;
          status_id?: number | null;
        };
      };

      maintenance_records: {
        Row: {
          maintenance_id: number;
          truck_id: number;
          maintenance_type: string;
          maintenance_date: string;
          mileage: number | null;
          description: string | null;
          cost: number | null;
          mechanic_notes: string | null;
          status_id: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          maintenance_id?: number;
          truck_id: number;
          maintenance_type: string;
          maintenance_date: string;
          mileage?: number | null;
          description?: string | null;
          cost?: number | null;
          mechanic_notes?: string | null;
          status_id?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          maintenance_id?: number;
          truck_id?: number;
          maintenance_type?: string;
          maintenance_date?: string;
          mileage?: number | null;
          description?: string | null;
          cost?: number | null;
          mechanic_notes?: string | null;
          status_id?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };

      record_status: {
        Row: {
          status_id: number;
          status_name: string;
        };
        Insert: {
          status_id?: number;
          status_name: string;
        };
        Update: {
          status_id?: number;
          status_name?: string;
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
          origin_location_id: number | null;
          destination_location_id: number | null;
          estimated_time: string | null;
          miles: number | null;
          status_id: number | null;
          waypoints: unknown[] | null;
        };
        Insert: {
          route_id?: number;
          origin_location_id?: number | null;
          destination_location_id?: number | null;
          estimated_time?: string | null;
          miles?: number | null;
          status_id?: number | null;
          waypoints?: unknown[] | null;
        };
        Update: {
          route_id?: number;
          origin_location_id?: number | null;
          destination_location_id?: number | null;
          estimated_time?: string | null;
          miles?: number | null;
          status_id?: number | null;
          waypoints?: unknown[] | null;
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
          plate_number: string | null;
          vin: string | null;
          truck_name: string | null;
          empty_weight: number | null;
          photo_url: string | null;
          driver_id: number | null;
        };
        Insert: {
          truck_id?: number;
          unit_number: string;
          vehicle_type?: string | null;
          capacity?: string | null;
          operational_status?: string | null;
          carrier_id?: number | null;
          status_id?: number | null;
          plate_number?: string | null;
          vin?: string | null;
          truck_name?: string | null;
          empty_weight?: number | null;
          photo_url?: string | null;
          driver_id?: number | null;
        };
        Update: {
          truck_id?: number;
          unit_number?: string;
          vehicle_type?: string | null;
          capacity?: string | null;
          operational_status?: string | null;
          carrier_id?: number | null;
          status_id?: number | null;
          plate_number?: string | null;
          vin?: string | null;
          truck_name?: string | null;
          empty_weight?: number | null;
          photo_url?: string | null;
          driver_id?: number | null;
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
      get_broker_contacts: {
        Args: { p_broker_id: number };
        Returns: Array<{
          contact_id: number;
          contact_name: string;
          email: string | null;
          phone: string | null;
          is_primary: boolean;
        }>;
      };

      get_carrier_dispatch_fee: {
        Args: { p_carrier_id: number };
        Returns: number;
      };

      get_drivers_by_carrier: {
        Args: { p_carrier_id: number };
        Returns: Array<{
          driver_id: number;
          first_name: string;
          last_name: string;
          phone_number: string | null;
          license_type: string | null;
          cdl_number: string | null;
        }>;
      };

      get_maintenance_records: {
        Args: { p_truck_id: number };
        Returns: Array<{
          maintenance_id: number;
          maintenance_type: string;
          maintenance_date: string;
          mileage: number | null;
          description: string | null;
          cost: number | null;
          mechanic_notes: string | null;
        }>;
      };

      get_truck_load_history: {
        Args: { p_truck_id: number; p_days: number };
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

      get_trucks_by_carrier: {
        Args: { p_carrier_id: number };
        Returns: Array<{
          truck_id: number;
          unit_number: string;
          truck_name: string;
          vehicle_type: string | null;
          driver_id: number | null;
          driver_name: string;
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

      search_brokers: {
        Args: {
          p_search: string | null;
          p_status_id: number | null;
          p_limit: number;
          p_offset: number;
        };
        Returns: Array<{
          broker_id: number;
          first_name: string;
          last_name: string;
          email: string | null;
          phone_number: string | null;
          mc_number: string | null;
          usdot_number: string | null;
          status_id: number;
          status_name: string;
          total_count: number;
        }>;
      };

      search_carriers: {
        Args: {
          p_search: string | null;
          p_status_id: number | null;
          p_limit: number;
          p_offset: number;
        };
        Returns: Array<{
          carrier_id: number;
          company_name: string;
          owner_name: string | null;
          email: string | null;
          phone_number: string | null;
          motor_carrier_id: string | null;
          mc_number: string | null;
          dot_number: string | null;
          dispatch_fee_percent: number;
          factoring: boolean | null;
          status_id: number;
          status_name: string;
          total_count: number;
        }>;
      };

      search_drivers: {
        Args: {
          p_search: string | null;
          p_status_id: number | null;
          p_limit: number;
          p_offset: number;
        };
        Returns: Array<{
          driver_id: number;
          first_name: string;
          last_name: string;
          phone_number: string | null;
          license_type: string | null;
          cdl_number: string | null;
          carrier_id: number | null;
          carrier_company_name: string | null;
          has_twic_card: boolean;
          status_id: number;
          status_name: string;
          total_count: number;
        }>;
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
          weight_lbs: number | null;
          rate: number | null;
          load_status: string | null;
          paid_status: string | null;
          factoring: boolean;
          carrier_id: number | null;
          truck_id: number | null;
          driver_id: number | null;
          route_id: number | null;
          cargo_type_id: number | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          carrier_company_name: string | null;
          driver_name: string | null;
          unit_number: string | null;
          miles: number | null;
          cargo_type_name: string | null;
          broker_name: string | null;
          broker_mc: string | null;
          dispatch_fee: number;
          total_count: number;
        }>;
      };

      search_trucks: {
        Args: {
          p_search: string | null;
          p_status_id: number;
          p_limit: number;
          p_offset: number;
        };
        Returns: Array<{
          truck_id: number;
          unit_number: string;
          plate_number: string | null;
          vin: string | null;
          truck_name: string;
          vehicle_type: string | null;
          capacity: string | null;
          empty_weight: number | null;
          operational_status: string | null;
          carrier_id: number | null;
          driver_id: number | null;
          driver_first_name: string | null;
          driver_last_name: string | null;
          carrier_company_name: string | null;
          status_id: number;
          status_name: string;
          total_count: number;
        }>;
      };

      toggle_employee_status: {
        Args: { p_employee_id: number };
        Returns: boolean;
      };

      update_employee_role: {
        Args: { p_employee_id: number; p_role_id: number };
        Returns: boolean;
      };
    };
  };
};

