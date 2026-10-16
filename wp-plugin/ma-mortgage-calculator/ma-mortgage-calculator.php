<?php
/**
 * Plugin Name: Massachusetts Mortgage Calculator
 * Description: Buyer payment calculator with Massachusetts town property taxes, insurance, PMI/MIP and HOA. Shortcodes: [ma_mortgage_calculator] and [ma_mortgage_tax_table].
 * Version: 1.0.0
 * Author: The Mikel DeFrancesco Team
 * Text Domain: ma-mortgage-calculator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MMC_VERSION', '1.0.0' );
define( 'MMC_OPTION', 'mmc_settings' );

/**
 * Default town list. One per line: Town|County|Rate per $1,000|verified (1) or estimate (0).
 * [TEAM] Confirm every rate against the MA DOR tax rate report and update each fiscal year.
 */
function mmc_default_towns() {
	return implode( "\n", array(
		'Abington|Plymouth|13.12|0', 'Attleboro|Bristol|11.30|0', 'Avon|Norfolk|15.22|0', 'Boston|Suffolk|12.40|1',
		'Braintree|Norfolk|10.04|0', 'Bridgewater|Plymouth|12.30|0', 'Brockton|Plymouth|12.65|0', 'Brookline|Norfolk|10.24|1',
		'Canton|Norfolk|11.53|0', 'Chelsea|Suffolk|11.89|0', 'Cohasset|Norfolk|11.79|0', 'Dedham|Norfolk|11.71|0',
		'Duxbury|Plymouth|10.26|0', 'Easton|Bristol|13.31|0', 'Fall River|Bristol|11.68|0', 'Foxborough|Norfolk|12.36|0',
		'Franklin|Norfolk|11.61|0', 'Hanover|Plymouth|12.69|0', 'Hingham|Plymouth|9.88|0', 'Holbrook|Norfolk|13.88|0',
		'Mansfield|Bristol|13.06|0', 'Marshfield|Plymouth|10.95|0', 'Medfield|Norfolk|14.61|0', 'Milton|Norfolk|11.81|1',
		'Needham|Norfolk|10.83|1', 'New Bedford|Bristol|12.79|0', 'Norfolk|Norfolk|13.33|0', 'Norwood|Norfolk|10.33|0',
		'Plymouth|Plymouth|11.59|0', 'Quincy|Norfolk|11.78|1', 'Randolph|Norfolk|12.46|0', 'Revere|Suffolk|10.51|0',
		'Rockland|Plymouth|13.81|0', 'Scituate|Plymouth|10.29|0', 'Sharon|Norfolk|16.27|0', 'Stoughton|Norfolk|11.81|1',
		'Taunton|Bristol|12.58|0', 'Walpole|Norfolk|11.47|0', 'Wellesley|Norfolk|10.17|1', 'Westwood|Norfolk|12.71|0',
		'Weymouth|Norfolk|10.43|0', 'Whitman|Plymouth|12.66|0', 'Winthrop|Suffolk|9.53|0', 'Wrentham|Norfolk|11.86|0',
	) );
}

function mmc_defaults() {
	return array(
		'rate'          => '6.25',
		'price'         => '600000',
		'down_pct'      => '20',
		'insurance'     => '1800',
		'default_town'  => 'Canton',
		'core_towns'    => 'Canton, Quincy, Braintree, Milton, Randolph, Weymouth, Stoughton, Sharon',
		'phone'         => '(617) 755-8272',
		'schedule_url'  => '#contact',
		'contact_url'   => '#contact',
		'towns'         => mmc_default_towns(),
	);
}

function mmc_settings() {
	return wp_parse_args( get_option( MMC_OPTION, array() ), mmc_defaults() );
}

function mmc_parse_towns( $raw ) {
	$towns = array();
	foreach ( preg_split( '/\r\n|\r|\n/', (string) $raw ) as $line ) {
		$parts = array_map( 'trim', explode( '|', $line ) );
		if ( count( $parts ) < 3 || '' === $parts[0] || ! is_numeric( $parts[2] ) ) {
			continue;
		}
		$towns[] = array(
			'name'     => $parts[0],
			'county'   => $parts[1],
			'rate'     => (float) $parts[2],
			'verified' => isset( $parts[3] ) && '1' === $parts[3],
		);
	}
	return $towns;
}

function mmc_tel( $phone ) {
	$digits = preg_replace( '/\D+/', '', $phone );
	if ( 10 === strlen( $digits ) ) {
		$digits = '1' . $digits;
	}
	return 'tel:+' . $digits;
}

/* ------------------------------------------------------------------ */
/* Assets                                                               */
/* ------------------------------------------------------------------ */

add_action( 'wp_enqueue_scripts', function () {
	wp_register_style( 'mmc-inter', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', array(), null );
	wp_register_style( 'mmc', plugins_url( 'assets/css/ma-mortgage-calculator.css', __FILE__ ), array( 'mmc-inter' ), MMC_VERSION );
	wp_register_script( 'mmc', plugins_url( 'assets/js/ma-mortgage-calculator.js', __FILE__ ), array(), MMC_VERSION, true );
} );

function mmc_enqueue() {
	static $done = false;
	if ( $done ) {
		return;
	}
	$done = true;
	$s    = mmc_settings();
	wp_enqueue_style( 'mmc' );
	wp_enqueue_script( 'mmc' );
	wp_localize_script( 'mmc', 'MMC_CONFIG', array(
		'defaults' => array(
			'price'   => (float) $s['price'],
			'downPct' => (float) $s['down_pct'],
			'rate'    => (float) $s['rate'],
			'term'    => 30,
			'type'    => 'conv',
			'town'    => $s['default_town'],
			'ins'     => (float) $s['insurance'],
			'hoa'     => 0,
		),
		'towns'    => mmc_parse_towns( $s['towns'] ),
	) );
}

/* ------------------------------------------------------------------ */
/* Icons                                                                */
/* ------------------------------------------------------------------ */

function mmc_icon( $name ) {
	$paths = array(
		'phone'  => '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
		'cal'    => '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
		'home'   => '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-6h6v6"/>',
		'calc'   => '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/>',
		'dollar' => '<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9.5c0-1-1.1-1.5-3-1.5s-3 .5-3 1.8c0 2.7 6 1.2 6 4 0 1.2-1.1 1.7-3 1.7s-3-.5-3-1.7"/>',
		'pin'    => '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
		'shield' => '<path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6Z"/><path d="m8.5 12 2.3 2.3 4.7-5"/>',
		'info'   => '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
		'reset'  => '<path d="M20 11a8.1 8.1 0 0 0-14.8-3L3 11M3 5v6h6M4 13a8.1 8.1 0 0 0 14.8 3L21 13M21 19v-6h-6"/>',
		'table'  => '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10"/>',
		'chev'   => '<path d="m6 9 6 6 6-6"/>',
		'mail'   => '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
	);
	return '<svg class="mmc-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' . $paths[ $name ] . '</svg>';
}

/* ------------------------------------------------------------------ */
/* [ma_mortgage_calculator]                                             */
/* ------------------------------------------------------------------ */

add_shortcode( 'ma_mortgage_calculator', function () {
	mmc_enqueue();
	$s     = mmc_settings();
	$tel   = esc_attr( mmc_tel( $s['phone'] ) );
	$phone = esc_html( $s['phone'] );
	$sched = esc_url( $s['schedule_url'] );
	$cont  = esc_url( $s['contact_url'] );

	ob_start();
	?>
<div class="mmc-widget" data-mmc>
	<div class="mmc-layout">
		<div class="mmc-card">
			<form class="mmc-form" data-mmc-form novalidate onsubmit="return false">
				<div class="mmc-card-header">
					<div>
						<h2>Your home details</h2>
						<p>A few numbers. A clearer monthly payment.</p>
					</div>
					<button type="button" class="mmc-tbtn" data-mmc-reset><?php echo mmc_icon( 'reset' ); ?>Reset</button>
				</div>
				<div class="mmc-card-content">

					<section class="mmc-section">
						<div class="mmc-section-heading"><span class="mmc-section-icon"><?php echo mmc_icon( 'home' ); ?></span><h3>Price and down payment</h3></div>
						<div class="mmc-grid">
							<div class="mmc-field mmc-full">
								<label class="mmc-label" for="mmc-price">Home price</label>
								<div class="mmc-input-wrap"><span class="mmc-adorn mmc-l">$</span><input class="mmc-input" id="mmc-price" data-f="price" inputmode="decimal" autocomplete="off"></div>
								<input type="range" class="mmc-range" data-f="range" min="100000" max="2500000" step="5000" aria-label="Home price slider">
							</div>
							<div class="mmc-field mmc-full">
								<div class="mmc-label">
									<label for="mmc-down">Down payment</label>
									<div class="mmc-seg" role="group" aria-label="Down payment unit">
										<button type="button" data-unit="pct" aria-pressed="true">%</button>
										<button type="button" data-unit="usd" aria-pressed="false">$</button>
									</div>
								</div>
								<div class="mmc-input-wrap"><span class="mmc-adorn mmc-l" data-o="down-l">$</span><input class="mmc-input" id="mmc-down" data-f="down" inputmode="decimal" autocomplete="off"><span class="mmc-adorn mmc-r" data-o="down-r">%</span></div>
								<div class="mmc-chips" role="group" aria-label="Quick down payment">
									<button type="button" class="mmc-chip" data-dp="3">3%</button>
									<button type="button" class="mmc-chip" data-dp="3.5">3.5%</button>
									<button type="button" class="mmc-chip" data-dp="5">5%</button>
									<button type="button" class="mmc-chip" data-dp="10">10%</button>
									<button type="button" class="mmc-chip" data-dp="20">20%</button>
								</div>
								<p class="mmc-help" data-o="down-help"></p>
							</div>
						</div>
					</section>

					<section class="mmc-section">
						<div class="mmc-section-heading"><span class="mmc-section-icon"><?php echo mmc_icon( 'dollar' ); ?></span><h3>Loan</h3></div>
						<div class="mmc-grid">
							<div class="mmc-field">
								<label class="mmc-label" for="mmc-rate">Interest rate</label>
								<div class="mmc-input-wrap"><input class="mmc-input mmc-pct" id="mmc-rate" data-f="rate" inputmode="decimal" autocomplete="off"><span class="mmc-adorn mmc-r">%</span></div>
								<p class="mmc-help">Use a current quote if you have one.</p>
							</div>
							<div class="mmc-field">
								<label class="mmc-label" for="mmc-term">Loan term</label>
								<select class="mmc-select" id="mmc-term" data-f="term">
									<option value="30">30 years</option>
									<option value="20">20 years</option>
									<option value="15">15 years</option>
									<option value="10">10 years</option>
								</select>
							</div>
							<div class="mmc-field mmc-full">
								<label class="mmc-label" for="mmc-type">Loan type</label>
								<select class="mmc-select" id="mmc-type" data-f="type">
									<option value="conv">Conventional</option>
									<option value="fha">FHA</option>
									<option value="va">VA</option>
								</select>
								<p class="mmc-help" data-o="type-help"></p>
							</div>
						</div>
					</section>

					<section class="mmc-section">
						<div class="mmc-section-heading"><span class="mmc-section-icon"><?php echo mmc_icon( 'pin' ); ?></span><h3>Town and property tax</h3></div>
						<div class="mmc-grid">
							<div class="mmc-field">
								<label class="mmc-label" for="mmc-town">Town</label>
								<select class="mmc-select" id="mmc-town" data-f="town"></select>
							</div>
							<div class="mmc-field">
								<label class="mmc-label" for="mmc-taxrate">Tax rate (per $1,000)</label>
								<div class="mmc-input-wrap"><span class="mmc-adorn mmc-l">$</span><input class="mmc-input" id="mmc-taxrate" data-f="taxrate" inputmode="decimal" autocomplete="off"></div>
							</div>
						</div>
						<div class="mmc-meta" data-o="tax-meta"></div>
					</section>

					<section class="mmc-section">
						<div class="mmc-section-heading"><span class="mmc-section-icon"><?php echo mmc_icon( 'shield' ); ?></span><h3>Insurance and fees</h3></div>
						<div class="mmc-grid">
							<div class="mmc-field">
								<label class="mmc-label" for="mmc-ins">Homeowners insurance <span class="mmc-muted">/ year</span></label>
								<div class="mmc-input-wrap"><span class="mmc-adorn mmc-l">$</span><input class="mmc-input" id="mmc-ins" data-f="ins" inputmode="decimal" autocomplete="off"></div>
							</div>
							<div class="mmc-field">
								<label class="mmc-label" for="mmc-hoa">HOA / condo fee <span class="mmc-muted">/ month</span></label>
								<div class="mmc-input-wrap"><span class="mmc-adorn mmc-l">$</span><input class="mmc-input" id="mmc-hoa" data-f="hoa" inputmode="decimal" autocomplete="off"></div>
							</div>
							<div class="mmc-field mmc-full">
								<div class="mmc-label">
									<label for="mmc-mi">PMI / mortgage insurance <span class="mmc-muted">/ month</span></label>
									<span><span class="mmc-badge" data-o="mi-badge">Auto</span> <button type="button" class="mmc-linkbtn" data-o="mi-auto" hidden>Use auto</button></span>
								</div>
								<div class="mmc-input-wrap"><span class="mmc-adorn mmc-l">$</span><input class="mmc-input" id="mmc-mi" data-f="mi" inputmode="decimal" autocomplete="off"></div>
								<p class="mmc-help" data-o="mi-help"></p>
							</div>
						</div>
						<p class="mmc-note"><?php echo mmc_icon( 'info' ); ?>Every field is editable. Results update as you type.</p>
					</section>

				</div>
			</form>
		</div>

		<div class="mmc-results" data-mmc-results aria-live="polite">
			<div class="mmc-card">
				<div class="mmc-result-hero">
					<div class="mmc-result-header">
						<h2><?php echo mmc_icon( 'calc' ); ?>Your estimate</h2>
						<span data-o="town-label"></span>
					</div>
					<div class="mmc-result-summary">
						<h3>Estimated total monthly payment</h3>
						<div class="mmc-result-value" data-o="total">$0</div>
						<div class="mmc-stack" data-o="stack" aria-hidden="true"></div>
					</div>
					<div class="mmc-metrics">
						<div class="mmc-metric">Loan amount<strong data-o="loan">$0</strong></div>
						<div class="mmc-metric">Total interest<strong data-o="interest">$0</strong></div>
					</div>
				</div>
				<div class="mmc-details">
					<div class="mmc-details-heading"><h3>Monthly breakdown</h3><span data-o="payoff"></span></div>
					<div data-o="rows"></div>
					<div class="mmc-total-row"><span>Total monthly payment</span><span data-o="total2">$0</span></div>
				</div>
				<div class="mmc-extra" data-o="extra"></div>
				<div class="mmc-result-cta">
					<a class="mmc-btn mmc-btn-primary" href="<?php echo $tel; ?>"><?php echo mmc_icon( 'phone' ); ?>Call Now <?php echo $phone; ?></a>
					<a class="mmc-btn mmc-btn-outline" href="<?php echo $sched; ?>"><?php echo mmc_icon( 'cal' ); ?>Schedule a Call</a>
				</div>
			</div>
		</div>
	</div>

	<details class="mmc-card mmc-amort" data-o="amort">
		<summary><span class="mmc-section-icon"><?php echo mmc_icon( 'table' ); ?></span>Amortization schedule<span class="mmc-chev"><?php echo mmc_icon( 'chev' ); ?></span></summary>
		<div class="mmc-amort-body">
			<div class="mmc-amort-controls">
				<div class="mmc-seg" role="group" aria-label="Schedule view">
					<button type="button" data-view="year" aria-pressed="true">Yearly</button>
					<button type="button" data-view="month" aria-pressed="false">Monthly</button>
				</div>
			</div>
			<table class="mmc-table">
				<thead><tr><th data-o="period">Year</th><th>Principal</th><th>Interest</th><th>Total P&amp;I</th><th>Remaining balance</th></tr></thead>
				<tbody data-o="amort-body"></tbody>
			</table>
		</div>
	</details>

	<div class="mmc-under">
		<p>Want to talk through your numbers? Call Mikel at <a href="<?php echo $tel; ?>"><?php echo $phone; ?></a> or schedule a quick call.</p>
		<div class="mmc-btn-row">
			<a class="mmc-btn mmc-btn-primary mmc-btn-sm" href="<?php echo $tel; ?>"><?php echo mmc_icon( 'phone' ); ?>Call Now</a>
			<a class="mmc-btn mmc-btn-outline mmc-btn-sm" href="<?php echo $cont; ?>"><?php echo mmc_icon( 'mail' ); ?>Contact Us</a>
		</div>
	</div>
	<p class="mmc-disclaimer">This Massachusetts mortgage calculator provides estimates only and is not a loan offer or commitment to lend. Actual rates, taxes, insurance and payments will vary. Equal Housing Opportunity.</p>

	<div class="mmc-mobile-bar" data-mmc-bar>
		<div>Est. monthly payment<strong data-o="mobile-total">$0</strong></div>
		<a class="mmc-btn" href="<?php echo $tel; ?>"><?php echo mmc_icon( 'phone' ); ?>Call</a>
	</div>
</div>
	<?php
	return ob_get_clean();
} );

/* ------------------------------------------------------------------ */
/* [ma_mortgage_tax_table]                                              */
/* ------------------------------------------------------------------ */

add_shortcode( 'ma_mortgage_tax_table', function ( $atts ) {
	mmc_enqueue();
	$s     = mmc_settings();
	$atts  = shortcode_atts( array( 'price' => 600000, 'towns' => $s['core_towns'] ), $atts, 'ma_mortgage_tax_table' );
	$price = (float) $atts['price'];
	$all   = array();
	foreach ( mmc_parse_towns( $s['towns'] ) as $t ) {
		$all[ $t['name'] ] = $t;
	}

	ob_start();
	?>
<div class="mmc-widget">
	<div class="mmc-tax-table">
		<table class="mmc-table">
			<thead><tr><th>Town</th><th>Residential tax rate (per $1,000)</th><th>Annual tax on a $<?php echo esc_html( number_format( $price ) ); ?> home</th></tr></thead>
			<tbody>
			<?php foreach ( array_map( 'trim', explode( ',', $atts['towns'] ) ) as $name ) :
				if ( ! isset( $all[ $name ] ) ) {
					continue;
				}
				$t = $all[ $name ];
				?>
				<tr>
					<td><button type="button" class="mmc-town-link" data-mmc-town="<?php echo esc_attr( $t['name'] ); ?>"><?php echo esc_html( $t['name'] ); ?></button></td>
					<td>$<?php echo esc_html( number_format( $t['rate'], 2 ) ); ?></td>
					<td>$<?php echo esc_html( number_format( round( $price * $t['rate'] / 1000 ) ) ); ?></td>
				</tr>
			<?php endforeach; ?>
			</tbody>
		</table>
	</div>
	<p class="mmc-table-note">Tax rates are set per $1,000 of assessed value. A home's assessed value may differ from its sale price. Source: <a href="https://www.mass.gov/orgs/division-of-local-services" rel="noopener" target="_blank">Massachusetts DOR Division of Local Services</a>. Click a town to load it into the calculator.</p>
</div>
	<?php
	return ob_get_clean();
} );

/* ------------------------------------------------------------------ */
/* Settings page: Settings > Mortgage Calculator                        */
/* ------------------------------------------------------------------ */

add_action( 'admin_menu', function () {
	add_options_page( 'Mortgage Calculator', 'Mortgage Calculator', 'manage_options', 'mmc-settings', 'mmc_render_settings' );
} );

add_action( 'admin_init', function () {
	register_setting( 'mmc', MMC_OPTION, array(
		'type'              => 'array',
		'sanitize_callback' => function ( $in ) {
			$d   = mmc_defaults();
			$out = array();
			foreach ( array( 'rate', 'price', 'down_pct', 'insurance' ) as $k ) {
				$out[ $k ] = isset( $in[ $k ] ) && is_numeric( $in[ $k ] ) ? (string) (float) $in[ $k ] : $d[ $k ];
			}
			foreach ( array( 'default_town', 'core_towns', 'phone' ) as $k ) {
				$out[ $k ] = isset( $in[ $k ] ) ? sanitize_text_field( $in[ $k ] ) : $d[ $k ];
			}
			foreach ( array( 'schedule_url', 'contact_url' ) as $k ) {
				$v         = isset( $in[ $k ] ) ? trim( $in[ $k ] ) : '';
				$out[ $k ] = '' === $v ? $d[ $k ] : ( 0 === strpos( $v, '#' ) ? sanitize_text_field( $v ) : esc_url_raw( $v ) );
			}
			$out['towns'] = isset( $in['towns'] ) ? sanitize_textarea_field( $in['towns'] ) : $d['towns'];
			return $out;
		},
	) );
} );

function mmc_render_settings() {
	$s = mmc_settings();
	$f = function ( $key, $label, $help = '' ) use ( $s ) {
		printf(
			'<tr><th scope="row"><label for="mmc-%1$s">%2$s</label></th><td><input class="regular-text" id="mmc-%1$s" name="%3$s[%1$s]" value="%4$s">%5$s</td></tr>',
			esc_attr( $key ), esc_html( $label ), esc_attr( MMC_OPTION ), esc_attr( $s[ $key ] ),
			$help ? '<p class="description">' . esc_html( $help ) . '</p>' : ''
		);
	};
	?>
	<div class="wrap">
		<h1>Massachusetts Mortgage Calculator</h1>
		<p>Shortcodes: <code>[ma_mortgage_calculator]</code> for the calculator and <code>[ma_mortgage_tax_table]</code> for the town tax table.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'mmc' ); ?>
			<table class="form-table" role="presentation">
				<?php
				$f( 'rate', 'Default interest rate (%)', 'Set to the current 30-year average. Update monthly.' );
				$f( 'price', 'Default home price ($)' );
				$f( 'down_pct', 'Default down payment (%)' );
				$f( 'insurance', 'Default homeowners insurance ($/year)' );
				$f( 'default_town', 'Default town', 'Must match a town name in the list below.' );
				$f( 'core_towns', 'Towns in the tax table', 'Comma-separated, in display order.' );
				$f( 'phone', 'Phone number' );
				$f( 'schedule_url', 'Schedule a Call link', 'Booking page URL, or #contact to jump to the contact section.' );
				$f( 'contact_url', 'Contact Us link' );
				?>
				<tr>
					<th scope="row"><label for="mmc-towns">Town tax rates</label></th>
					<td>
						<textarea id="mmc-towns" name="<?php echo esc_attr( MMC_OPTION ); ?>[towns]" rows="20" class="large-text code"><?php echo esc_textarea( $s['towns'] ); ?></textarea>
						<p class="description">One town per line: <code>Town|County|Rate per $1,000|1 if verified, 0 if estimate</code>. Update each year when MA DOR publishes new rates.</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}

add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), function ( $links ) {
	array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=mmc-settings' ) ) . '">Settings</a>' );
	return $links;
} );
