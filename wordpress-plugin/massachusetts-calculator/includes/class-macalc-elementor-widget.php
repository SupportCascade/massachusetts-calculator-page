<?php
/**
 * "Massachusetts Calculator" Elementor widget. It renders the same output as the
 * [massachusetts_calculator] or [massachusetts_calculator_page] shortcode, with the defaults
 * editable in the panel.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class MACALC_Elementor_Widget extends \Elementor\Widget_Base {

	public function get_name() {
		return 'massachusetts_calculator';
	}

	public function get_title() {
		return esc_html__( 'Massachusetts Calculator', 'massachusetts-calculator' );
	}

	public function get_icon() {
		return 'eicon-number-field';
	}

	public function get_categories() {
		return array( 'general' );
	}

	public function get_keywords() {
		return array( 'mortgage', 'calculator', 'massachusetts', 'payment', 'loan' );
	}

	public function get_style_depends() {
		return array( MACALC_HANDLE );
	}

	public function get_script_depends() {
		return array( MACALC_HANDLE );
	}

	protected function register_controls() {
		$d = macalc_defaults();

		$this->start_controls_section(
			'section_defaults',
			array(
				'label' => esc_html__( 'Starting values', 'massachusetts-calculator' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'layout',
			array(
				'label'       => esc_html__( 'Layout', 'massachusetts-calculator' ),
				'type'        => \Elementor\Controls_Manager::SELECT,
				'default'     => 'calculator',
				'options'     => array(
					'calculator' => esc_html__( 'Calculator only', 'massachusetts-calculator' ),
					'page'       => esc_html__( 'Full page (hero, calculator, copy, FAQs)', 'massachusetts-calculator' ),
				),
				'description' => esc_html__( 'Full page matches the [massachusetts_calculator_page] shortcode.', 'massachusetts-calculator' ),
			)
		);
		$this->add_control(
			'price',
			array(
				'label'   => esc_html__( 'Home price ($)', 'massachusetts-calculator' ),
				'type'    => \Elementor\Controls_Manager::NUMBER,
				'default' => $d['price'],
				'min'     => 0,
				'step'    => 1000,
			)
		);
		$this->add_control(
			'down_percent',
			array(
				'label'   => esc_html__( 'Down payment (%)', 'massachusetts-calculator' ),
				'type'    => \Elementor\Controls_Manager::NUMBER,
				'default' => $d['down_percent'],
				'min'     => 0,
				'max'     => 100,
				'step'    => 0.5,
			)
		);
		$this->add_control(
			'rate',
			array(
				'label'       => esc_html__( 'Interest rate (%)', 'massachusetts-calculator' ),
				'type'        => \Elementor\Controls_Manager::NUMBER,
				'default'     => $d['rate'],
				'min'         => 0,
				'max'         => 30,
				'step'        => 0.125,
				'description' => esc_html__( 'Placeholder. Set to the current 30-year average and update monthly.', 'massachusetts-calculator' ),
			)
		);
		$this->add_control(
			'term',
			array(
				'label'   => esc_html__( 'Loan term', 'massachusetts-calculator' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'default' => (string) $d['term'],
				'options' => array(
					'30' => esc_html__( '30 years', 'massachusetts-calculator' ),
					'20' => esc_html__( '20 years', 'massachusetts-calculator' ),
					'15' => esc_html__( '15 years', 'massachusetts-calculator' ),
					'10' => esc_html__( '10 years', 'massachusetts-calculator' ),
				),
			)
		);
		$this->add_control(
			'loan_type',
			array(
				'label'   => esc_html__( 'Loan type', 'massachusetts-calculator' ),
				'type'    => \Elementor\Controls_Manager::SELECT,
				'default' => $d['loan_type'],
				'options' => array(
					'conv' => esc_html__( 'Conventional', 'massachusetts-calculator' ),
					'fha'  => esc_html__( 'FHA', 'massachusetts-calculator' ),
					'va'   => esc_html__( 'VA', 'massachusetts-calculator' ),
				),
			)
		);
		$this->add_control(
			'town',
			array(
				'label'       => esc_html__( 'Town', 'massachusetts-calculator' ),
				'type'        => \Elementor\Controls_Manager::TEXT,
				'default'     => $d['town'],
				'description' => esc_html__( 'Must match a town in the calculator list, e.g. Canton, Quincy, Braintree.', 'massachusetts-calculator' ),
			)
		);
		$this->add_control(
			'insurance',
			array(
				'label'       => esc_html__( 'Homeowners insurance ($ / year)', 'massachusetts-calculator' ),
				'type'        => \Elementor\Controls_Manager::NUMBER,
				'default'     => $d['insurance'],
				'min'         => 0,
				'step'        => 50,
				'description' => esc_html__( 'Placeholder. Confirm a typical South Shore premium.', 'massachusetts-calculator' ),
			)
		);
		$this->add_control(
			'hoa',
			array(
				'label'   => esc_html__( 'HOA / condo fee ($ / month)', 'massachusetts-calculator' ),
				'type'    => \Elementor\Controls_Manager::NUMBER,
				'default' => $d['hoa'],
				'min'     => 0,
				'step'    => 10,
			)
		);

		$this->end_controls_section();

		$this->start_controls_section(
			'section_contact',
			array(
				'label' => esc_html__( 'Buttons and display', 'massachusetts-calculator' ),
				'tab'   => \Elementor\Controls_Manager::TAB_CONTENT,
			)
		);

		$this->add_control(
			'phone',
			array(
				'label'   => esc_html__( 'Phone number', 'massachusetts-calculator' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => $d['phone'],
			)
		);
		$this->add_control(
			'schedule_url',
			array(
				'label'       => esc_html__( 'Schedule a Call link', 'massachusetts-calculator' ),
				'type'        => \Elementor\Controls_Manager::TEXT,
				'default'     => $d['schedule_url'],
				'description' => esc_html__( 'A booking page URL, or #contact to jump to a section with the CSS ID "contact".', 'massachusetts-calculator' ),
			)
		);
		$this->add_control(
			'contact_url',
			array(
				'label'   => esc_html__( 'Contact Us link', 'massachusetts-calculator' ),
				'type'    => \Elementor\Controls_Manager::TEXT,
				'default' => $d['contact_url'],
			)
		);
		$this->add_control(
			'amortization',
			array(
				'label'        => esc_html__( 'Show amortization schedule', 'massachusetts-calculator' ),
				'type'         => \Elementor\Controls_Manager::SWITCHER,
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);
		$this->add_control(
			'disclaimer',
			array(
				'label'        => esc_html__( 'Show disclaimer', 'massachusetts-calculator' ),
				'type'         => \Elementor\Controls_Manager::SWITCHER,
				'return_value' => 'yes',
				'default'      => 'yes',
			)
		);

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		$atts     = array();

		foreach ( array_keys( macalc_defaults() ) as $key ) {
			if ( isset( $settings[ $key ] ) && '' !== $settings[ $key ] && null !== $settings[ $key ] ) {
				$atts[ $key ] = (string) $settings[ $key ];
			}
		}
		// Elementor switchers save an empty string when turned off.
		$atts['amortization'] = ( isset( $settings['amortization'] ) && 'yes' === $settings['amortization'] ) ? 'yes' : 'no';
		$atts['disclaimer']   = ( isset( $settings['disclaimer'] ) && 'yes' === $settings['disclaimer'] ) ? 'yes' : 'no';

		// Both render functions escape everything they output.
		if ( isset( $settings['layout'] ) && 'page' === $settings['layout'] ) {
			echo macalc_render_page( $atts ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		} else {
			echo macalc_render( $atts ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
	}
}
