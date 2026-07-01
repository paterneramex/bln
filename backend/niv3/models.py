from django.db import models

class Customers(models.Model):
    id = models.IntegerField(primary_key=True)
    customer_name = models.CharField(unique=True, max_length=64, blank=True, null=True)
    srvnewident = models.CharField(db_column='SRVnewIdent', unique=True, max_length=20)
    customer_prod = models.CharField(max_length=50, blank=True, null=True)
    customer_relais = models.CharField(max_length=16)
    customer_mac_dhcp = models.CharField(max_length=14)
    customer_mac_arp = models.CharField(max_length=14)
    customer_ip = models.CharField(unique=True, max_length=16)
    customer_mask = models.CharField(max_length=2)
    customer_pool = models.CharField(max_length=3)
    produit_level = models.BigIntegerField()
    pool_code = models.CharField(max_length=16)
    customer_etat = models.CharField(max_length=16)
    customer_rmq = models.CharField(max_length=254)
    bw_out = models.PositiveBigIntegerField()
    bw_in = models.PositiveBigIntegerField()
    bw_rapport = models.PositiveSmallIntegerField()
    customer_ap = models.CharField(max_length=32)
    customer_provider = models.CharField(max_length=16)

    class Meta:
        managed = False
        db_table = 'customers'
        unique_together = (('customer_ip', 'customer_mac_dhcp', 'customer_mac_arp'),)

    def __str__(self):
        return f"{self.customer_name or 'Unknown'} - {self.customer_ip}"


class Hbs(models.Model):
    id = models.IntegerField(primary_key=True)
    secteur_ip = models.CharField(max_length=15, db_collation='utf8mb3_general_ci', blank=True, null=True)
    code_relais = models.CharField(max_length=15, db_collation='utf8mb3_general_ci', blank=True, null=True)
    nom_relai = models.TextField()
    producttype = models.CharField(db_column='ProductType', max_length=100, blank=True, null=True)
    upgraded = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'hbs'

    def __str__(self):
        return f"{self.nom_relai} {self.secteur_ip}"


class Ipsups(models.Model):
    id = models.BigAutoField(primary_key=True)
    ipsup_name = models.CharField(max_length=64, blank=True, null=True)
    ipsup_dest = models.CharField(max_length=15)
    ipsup_netw = models.CharField(max_length=15)
    ipsup_mask_court = models.CharField(max_length=2)
    ipsup_mask_long = models.CharField(max_length=15)
    ipsup_relais = models.CharField(max_length=16, blank=True, null=True)
    ipsup_wildcard = models.CharField(max_length=15, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'ipsups'
        unique_together = (('ipsup_netw', 'ipsup_mask_court'),)

    def __str__(self):
        return f"{self.ipsup_name or 'Unassigned'} - {self.ipsup_netw}/{self.ipsup_mask_court}"


class Pools(models.Model):
    id = models.IntegerField(primary_key=True)
    pool_code = models.CharField(max_length=16, blank=True, null=True)
    pool_relais = models.CharField(max_length=16)
    pool_prod = models.CharField(max_length=16)
    pool_prod_name = models.CharField(max_length=16)
    pool_num = models.CharField(max_length=2)
    pool_host = models.CharField(max_length=15)
    pool_netw = models.CharField(max_length=15)
    pool_gtw = models.CharField(max_length=15)
    pool_mask_court = models.CharField(max_length=2)
    pool_mask_long = models.CharField(max_length=15)
    pool_deb = models.CharField(max_length=15)
    pool_fin = models.CharField(max_length=15)

    class Meta:
        managed = False
        db_table = 'pools'

    def __str__(self):
        return f"Pool {self.pool_code or ''} - {self.pool_netw}/{self.pool_mask_court}"