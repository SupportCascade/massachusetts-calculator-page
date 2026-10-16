<?php
/**
 * Plugin Name:       Massachusetts Home Sale Calculator
 * Description:       Massachusetts mortgage calculator with town property taxes, insurance, PMI/MIP and an amortization schedule. Use [massachusetts_calculator] for the calculator alone, [massachusetts_calculator_page] for the full page (hero, calculator, body copy, FAQs and schema), or the "Massachusetts Calculator" Elementor widget.
 * Version:           1.1.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Cascade Web Solutions
 * License:           GPL-2.0-or-later
 * Text Domain:       massachusetts-calculator
 *
 * The plugin folder is "massachusetts-calculator" on purpose: the site's existing proceeds
 * calculator lives in "massachusetts-home-sale-calculator", and reusing that folder would
 * overwrite it on upload.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MACALC_VERSION', '1.1.0' );
define( 'MACALC_URL', plugin_dir_url( __FILE__ ) );
define( 'MACALC_DIR', plugin_dir_path( __FILE__ ) );
define( 'MACALC_HANDLE', 'massachusetts-calculator' );
define( 'MACALC_SHORTCODE', 'massachusetts_calculator' );
define( 'MACALC_PAGE_SHORTCODE', 'massachusetts_calculator_page' );

/**
 * Default settings. These match the DEFAULTS in the calculator script and index.html.
 *
 * @return array
 */
function macalc_defaults() {
	return array(
		'price'        => 600000,
		'down_percent' => 20,
		'rate'         => 6.25,
		'term'         => 30,
		'loan_type'    => 'conv',
		'town'         => 'Canton',
		'insurance'    => 1800,
		'hoa'          => 0,
		'phone'        => '(617) 755-8272',
		'schedule_url' => '#contact',
		'contact_url'  => '#contact',
		'amortization' => 'yes',
		'disclaimer'   => 'yes',
	);
}

/**
 * Extra settings used only by the full-page shortcode.
 *
 * @return array
 */
function macalc_page_defaults() {
	return array(
		'proceeds_url' => '/massachusetts-home-sale-proceeds-calculator/',
		'updated'      => 'yes',
		'schema'       => 'yes',
	);
}

/**
 * Register the compiled CSS and JS.
 */
function macalc_register_assets() {
	wp_register_style( MACALC_HANDLE, MACALC_URL . 'assets/css/massachusetts-calculator.css', array(), MACALC_VERSION );
	wp_register_script( MACALC_HANDLE, MACALC_URL . 'assets/js/massachusetts-calculator.js', array(), MACALC_VERSION, true );
}
add_action( 'init', 'macalc_register_assets' );

/**
 * Enqueue the CSS and JS.
 */
function macalc_enqueue() {
	if ( ! wp_style_is( MACALC_HANDLE, 'registered' ) ) {
		macalc_register_assets();
	}
	wp_enqueue_style( MACALC_HANDLE );
	wp_enqueue_script( MACALC_HANDLE );
}

/**
 * Load the assets in <head> when the current page uses the calculator, so the styles are
 * present before the calculator renders. Pages built with Elementor keep their content in
 * the _elementor_data meta, so check that too. Anything missed here is still enqueued when
 * the shortcode renders (the CSS is then printed in the footer).
 */
function macalc_maybe_enqueue() {
	if ( ! is_singular() ) {
		return;
	}
	$post = get_post();
	if ( ! $post ) {
		return;
	}
	$found = has_shortcode( $post->post_content, MACALC_SHORTCODE ) || has_shortcode( $post->post_content, MACALC_PAGE_SHORTCODE );
	if ( ! $found ) {
		$data = get_post_meta( $post->ID, '_elementor_data', true );
		if ( is_string( $data ) && false !== strpos( $data, MACALC_SHORTCODE ) ) {
			$found = true;
		}
	}
	if ( $found ) {
		macalc_enqueue();
	}
}
add_action( 'wp_enqueue_scripts', 'macalc_maybe_enqueue' );

// Elementor editor preview: always load, because widgets are re-rendered over AJAX.
add_action( 'elementor/preview/enqueue_styles', 'macalc_enqueue' );
add_action( 'elementor/preview/enqueue_scripts', 'macalc_enqueue' );

/**
 * Read a number between $min and $max, or fall back to $default.
 *
 * @param mixed $value   Raw value.
 * @param float $default Fallback.
 * @param float $min     Minimum.
 * @param float $max     Maximum.
 * @return float
 */
function macalc_number( $value, $default, $min, $max ) {
	$value = preg_replace( '/[^0-9.]/', '', (string) $value );
	if ( '' === $value || ! is_numeric( $value ) ) {
		return (float) $default;
	}
	$value = (float) $value;
	if ( $value < $min || $value > $max ) {
		return (float) $default;
	}
	return $value;
}

/**
 * Read a yes/no setting.
 *
 * @param mixed $value Raw value.
 * @return bool
 */
function macalc_bool( $value ) {
	return ! in_array( strtolower( trim( (string) $value ) ), array( 'no', 'false', '0', 'off', '' ), true );
}

/**
 * Clean a link setting. Allows full URLs, site paths and #anchors.
 *
 * @param mixed  $value   Raw value.
 * @param string $default Fallback.
 * @return string
 */
function macalc_link( $value, $default ) {
	$url = esc_url_raw( trim( (string) $value ) );
	return '' !== $url ? $url : $default;
}

/**
 * Turn shortcode attributes / widget settings into the calculator config.
 *
 * @param array $atts Raw attributes.
 * @return array
 */
function macalc_config( $atts ) {
	$d = macalc_defaults();
	$a = shortcode_atts( $d, is_array( $atts ) ? $atts : array(), MACALC_SHORTCODE );

	$term = (int) macalc_number( $a['term'], $d['term'], 10, 30 );
	if ( ! in_array( $term, array( 30, 20, 15, 10 ), true ) ) {
		$term = (int) $d['term'];
	}
	$type = strtolower( sanitize_text_field( $a['loan_type'] ) );
	if ( ! in_array( $type, array( 'conv', 'fha', 'va' ), true ) ) {
		$type = $d['loan_type'];
	}

	$phone  = sanitize_text_field( $a['phone'] );
	$digits = preg_replace( '/\D/', '', $phone );
	if ( 10 === strlen( $digits ) ) {
		$digits = '1' . $digits;
	}
	if ( '' === $digits ) {
		$phone  = $d['phone'];
		$digits = '16177558272';
	}

	return array(
		'defaults'     => array(
			'price'   => macalc_number( $a['price'], $d['price'], 0, 100000000 ),
			'downPct' => macalc_number( $a['down_percent'], $d['down_percent'], 0, 100 ),
			'rate'    => macalc_number( $a['rate'], $d['rate'], 0, 30 ),
			'term'    => $term,
			'type'    => $type,
			'town'    => sanitize_text_field( $a['town'] ),
			'ins'     => macalc_number( $a['insurance'], $d['insurance'], 0, 1000000 ),
			'hoa'     => macalc_number( $a['hoa'], $d['hoa'], 0, 100000 ),
		),
		'phone'        => $phone,
		'phoneHref'    => '+' . $digits,
		'scheduleUrl'  => macalc_link( $a['schedule_url'], $d['schedule_url'] ),
		'contactUrl'   => macalc_link( $a['contact_url'], $d['contact_url'] ),
		'amortization' => macalc_bool( $a['amortization'] ),
		'disclaimer'   => macalc_bool( $a['disclaimer'] ),
	);
}

/**
 * Render the calculator container. The script builds the calculator inside it.
 *
 * @param array|string $atts Shortcode attributes.
 * @return string
 */
function macalc_render( $atts = array() ) {
	$config = macalc_config( $atts );

	macalc_enqueue();

	return '<div class="macalc" data-macalc="' . esc_attr( wp_json_encode( $config ) ) . '">'
		. '<noscript><p>' . esc_html__( 'Please enable JavaScript to use the Massachusetts mortgage calculator.', 'massachusetts-calculator' ) . '</p></noscript>'
		. '</div>';
}
add_shortcode( MACALC_SHORTCODE, 'macalc_render' );

/**
 * Render the full page: hero, calculator, body copy, tax table, loan cards, Talk to Mikel
 * band, FAQs and JSON-LD schema. The copy lives in templates/page.html; the site's own
 * header, footer and contact section stay in Elementor.
 *
 * @param array|string $atts Shortcode attributes (all calculator attributes, plus proceeds_url, updated, schema).
 * @return string
 */
function macalc_render_page( $atts = array() ) {
	$atts   = is_array( $atts ) ? $atts : array();
	$config = macalc_config( $atts );
	$p      = shortcode_atts( macalc_page_defaults(), $atts, MACALC_PAGE_SHORTCODE );

	$template = file_get_contents( MACALC_DIR . 'templates/page.html' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
	if ( false === $template ) {
		return macalc_render( $atts );
	}

	$proceeds = macalc_link( $p['proceeds_url'], macalc_page_defaults()['proceeds_url'] );
	if ( 0 === strpos( $proceeds, '/' ) ) {
		$proceeds = home_url( $proceeds );
	}

	$updated = '';
	if ( macalc_bool( $p['updated'] ) ) {
		$date = get_the_modified_date( 'F j, Y' );
		if ( $date ) {
			$updated = '<p class="mcp-updated">' . esc_html__( 'Last updated:', 'massachusetts-calculator' ) . ' ' . esc_html( $date ) . '</p>';
		}
	}

	$schema = '';
	if ( macalc_bool( $p['schema'] ) ) {
		$json = file_get_contents( MACALC_DIR . 'templates/schema.json' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		if ( false !== $json ) {
			$page_url = get_permalink();
			$digits   = ltrim( $config['phoneHref'], '+' );
			$tel      = '+' . substr( $digits, 0, 1 ) . '-' . substr( $digits, 1, 3 ) . '-' . substr( $digits, 4, 3 ) . '-' . substr( $digits, 7 );
			$json     = strtr(
				$json,
				array(
					'{{SCHEMA_PHONE}}' => macalc_json_string( $tel ),
					'{{HOME_URL}}'     => macalc_json_string( home_url( '/' ) ),
					'{{PAGE_URL}}'     => macalc_json_string( $page_url ? $page_url : home_url( '/massachusetts-mortgage-calculator/' ) ),
				)
			);
			$schema = '<script type="application/ld+json">' . $json . '</script>';
		}
	}

	return strtr(
		$template,
		array(
			'{{CALCULATOR}}'   => macalc_render( $atts ),
			'{{PHONE}}'        => esc_html( $config['phone'] ),
			'{{TEL}}'          => esc_url( 'tel:' . $config['phoneHref'] ),
			'{{SCHEDULE_URL}}' => esc_url( $config['scheduleUrl'] ),
			'{{CONTACT_URL}}'  => esc_url( $config['contactUrl'] ),
			'{{HOME_URL}}'     => esc_url( home_url( '/' ) ),
			'{{PROCEEDS_URL}}' => esc_url( $proceeds ),
			'{{UPDATED}}'      => $updated,
			'{{SCHEMA}}'       => $schema,
		)
	);
}
add_shortcode( MACALC_PAGE_SHORTCODE, 'macalc_render_page' );

/**
 * Encode a value for use inside a JSON string literal (without the surrounding quotes).
 *
 * @param string $value Value.
 * @return string
 */
function macalc_json_string( $value ) {
	return substr( wp_json_encode( (string) $value ), 1, -1 );
}

/**
 * Register the native Elementor widget.
 *
 * @param \Elementor\Widgets_Manager $widgets_manager Elementor widgets manager.
 */
function macalc_register_elementor_widget( $widgets_manager ) {
	require_once MACALC_DIR . 'includes/class-macalc-elementor-widget.php';
	$widgets_manager->register( new MACALC_Elementor_Widget() );
}
add_action( 'elementor/widgets/register', 'macalc_register_elementor_widget' );
