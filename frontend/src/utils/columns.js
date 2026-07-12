// src/utils/columns.js
//
// Every field of every table, in DB column order, driving the DataTable
// headers/filters. Kept separate from the components so adding a column
// later is a one-line change here instead of hunting through JSX.

export const CUSTOMER_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'srvnewident', label: 'SRVnewIdent' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_prod', label: 'Product' },
  { key: 'customer_relais', label: 'Relay' },
  { key: 'customer_mac_dhcp', label: 'MAC (DHCP)' },
  { key: 'customer_mac_arp', label: 'MAC (ARP)' },
  { key: 'customer_ip', label: 'IP' },
  { key: 'customer_mask', label: 'Mask' },
  { key: 'customer_pool', label: 'Customer Pool' },
  { key: 'produit_level', label: 'Product Level' },
  { key: 'pool_code', label: 'Pool Code' },
  { key: 'customer_etat', label: 'State' },
  { key: 'customer_rmq', label: 'Remark' },
  { key: 'bw_out', label: 'BW Out' },
  { key: 'bw_in', label: 'BW In' },
  { key: 'bw_rapport', label: 'BW Ratio' },
  { key: 'customer_ap', label: 'Access Point' },
  { key: 'customer_provider', label: 'Provider' },
];

export const POOL_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'pool_code', label: 'Pool Code' },
  { key: 'pool_relais', label: 'Relay' },
  { key: 'pool_prod', label: 'Product' },
  { key: 'pool_prod_name', label: 'Product Name' },
  { key: 'pool_num', label: 'Pool Num' },
  { key: 'pool_host', label: 'Host' },
  { key: 'pool_netw', label: 'Network' },
  { key: 'pool_gtw', label: 'Gateway' },
  { key: 'pool_mask_court', label: 'Mask (short)' },
  { key: 'pool_mask_long', label: 'Mask (long)' },
  { key: 'pool_deb', label: 'Range Start' },
  { key: 'pool_fin', label: 'Range End' },
];

export const IPSUP_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'ipsup_name', label: 'Name' },
  { key: 'ipsup_dest', label: 'Destination' },
  { key: 'ipsup_netw', label: 'Network' },
  { key: 'ipsup_mask_court', label: 'Mask (short)' },
  { key: 'ipsup_mask_long', label: 'Mask (long)' },
  { key: 'ipsup_relais', label: 'Relay' },
  { key: 'ipsup_wildcard', label: 'Wildcard' },
];

export const HBS_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'secteur_ip', label: 'Sector IP' },
  { key: 'code_relais', label: 'Relay Code' },
  { key: 'nom_relai', label: 'Relay Name' },
  { key: 'producttype', label: 'Product Type' },
  { key: 'upgraded', label: 'Upgraded' },
];

export const COLUMNS_BY_TAB = {
  customers: CUSTOMER_COLUMNS,
  pools: POOL_COLUMNS,
  ipsups: IPSUP_COLUMNS,
  hbs: HBS_COLUMNS,
};
